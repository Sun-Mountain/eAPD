#!/bin/bash

# Call with the following arguments:
#    --API_PBKDF2_ITERATIONS <number> | Number of PBKDF2 iterations the server
#                                     | should use for hashing user passwords.
#                                     |----------------------------------------
#    --AWS_AMI <AMI ID>               | Image ID of the AMI to use for the new
#                                     | instance
#                                     |----------------------------------------
#    --AWS_REGION <AWS region name>   | The AWS region the instance should be
#                                     | created in
#                                     |----------------------------------------
#    --AWS_SECURITY_GROUP <group ID>  | ID of the security group for the
#                                     | instance
#                                     |----------------------------------------
#    --AWS_SUBNET <subnet ID>         | ID of the subnet this instance should
#                                     | be attached to
#                                     |----------------------------------------
#    --BUILD_URL <URL>                | The URL to the zip file containing the
#                                     | built API. This zip will be pulled into
#                                     | the EC2 instance and launched.
#                                     |----------------------------------------
#    --PR_NUM <number>                | The PR number for this preview. This is
#                                     | used to tag the instance as well as to
#                                     | find previous instances for this PR.
#                                     |----------------------------------------
#    --OKTA_DOMAIN <string>           |

# Exit when any command fails
set -e

function print() {
  echo "$1" >&2
}

# Deploys a preview instance to EC2 with a fully self-contained environment.
function deployPreviewtoEC2() {
  # Configure AWS CLI with defaults
  configureAWS

  # Inject configuration information from the environment into the user data
  configureUserData

  # Find any existing preview deploys
  print "• Finding existing preview instances"
  EXISTING_INSTANCES=$(findExistingInstances)

  # Create new EC2 instance
  print "• Creating EC2 instance"
  INSTANCE_ID=$(createNewInstance)
  print "• Created instance $INSTANCE_ID"

  # Wait for the instance to become ready.  This will happen once the VM is
  # networkically available, which isn't strictly useful to us, but it's as
  # good an indication as we'll get that the machine is ready to do stuff.
  print "• Waiting for instance to be ready"
  waitForInstanceToBeReady $INSTANCE_ID

  print "• Getting public DNS name of new instance"
  PUBLIC_DNS=$(getPublicDNS $INSTANCE_ID)
  print "• Public address: $PUBLIC_DNS"

  print "• Cleaning up previous instances"
  while read -r INSTANCE_ID; do
    terminateInstance "$INSTANCE_ID"
  done <<< "$EXISTING_INSTANCES"

  echo "$PUBLIC_DNS"
}

# Sets up AWS global configuration for all subsequent commands.
#
# Expects global environment variables:
#   AWS_REGION - The AWS region to use
function configureAWS() {
  aws configure set default.region $AWS_REGION
}

# Updates the EC2 user data script with values from the environment.
#
# Expects global environment variables:
#   API_PBKDF2_ITERATIONS - Number of iterations for hashing passwords
#   BRANCH - the git branch that should be checked out/built
function configureUserData() {
  # Use vertical pipes as sed delimiters instead of slashes, since git branch
  # names can contain slashes
  sed -i'.backup' -e "s|__GIT_BRANCH__|\"`echo $BRANCH`\"|g" aws.user-data.sh

  sed -i'.backup' -e "s/__PBKDF2_ITERATIONS__/`echo $API_PBKDF2_ITERATIONS`/g" aws.user-data.sh

  sed -i'.backup' -e "s/__OKTA_DOMAIN__/`echo $OKTA_DOMAIN`/g" aws.user-data.sh

  rm aws.user-data.sh.backup
}

# Create a new EC2 instance. Echos the new instance ID.
#
# Expects global environment variables:
#   AWS_AMI - Image ID of the AMI to use for this instance
#   AWS_SECURITY_GROUP - ID of the security group for this instance
#   AWS_SUBNET - ID of the subnet this instance should be attached to
#   PR_NUM - Github pull request number associated with this instance
function createNewInstance() {
  aws ec2 run-instances \
    --instance-type t2.medium \
    --image-id $AWS_AMI \
    --security-group-ids $AWS_SECURITY_GROUP \
    --subnet-id $AWS_SUBNET \
    --tag-specification "ResourceType=instance,Tags=[{Key=Name,Value=eAPD PR $PR_NUM},{Key=environment,Value=preview},{Key=github-pr,Value=${PR_NUM}}]" \
    --user-data file://aws.user-data.sh \
    | jq -r -c '.Instances[0].InstanceId'
}

# Finds any existing instances for previewing this PR
#
# Expects global environment variables:
#   PR_NUM - Github pull request number associated with this instance
function findExistingInstances() {
  aws ec2 describe-instances \
    --filter Name=tag:github-pr,Values=$PR_NUM \
    --query "Reservations[*].Instances[*].InstanceId" \
    | jq -c -r '.[] | join("")'
}

# Get the public DNS name for an instance.
#
# $1 - ID of the EC2 instance to get the public DNS name for
function getPublicDNS() {
  aws ec2 describe-instances \
    --instance-ids $1 \
    | jq -r -c '.Reservations[0].Instances[0].PublicDnsName'
}

# Terminates a list of instances
#
# $1 - list of instance ID to delete
function terminateInstance() {
  # This command can fail if AWS doesn't recognize the instance ID, but in that
  # case we really, really don't care; so don't stop the script if it errors.
  set +e
  print "  ...terminating existing instance: $1"
  aws ec2 terminate-instances \
    --instance-ids "$1" \
    > /dev/null
  set -e
}

# Wait for EC2 instance status checks to be "passed"
#
# $1 - ID of the EC2 instance to wait for
function waitForInstanceToBeReady() {
  sleep 10s
  INSTANCE_CHECK_COUNT=1
  INSTANCE_STATUS=$(aws ec2 describe-instance-status --instance-ids $1)
  INSTANCE_CHECK1=$(echo $INSTANCE_STATUS | jq -r -c '.InstanceStatuses[0].SystemStatus.Details[0].Status')
  INSTANCE_CHECK2=$(echo $INSTANCE_STATUS | jq -r -c '.InstanceStatuses[0].InstanceStatus.Details[0].Status')
  while [[ "$INSTANCE_CHECK1" != "passed" || "$INSTANCE_CHECK2" -ne "passed" ]]; do
    print "  ...status check #$INSTANCE_CHECK_COUNT: not ready"
    sleep 30s
    INSTANCE_STATUS=$(aws ec2 describe-instance-status --instance-ids $1)
    INSTANCE_CHECK1=$(echo $INSTANCE_STATUS | jq -r -c '.InstanceStatuses[0].SystemStatus.Details[0].Status')
    INSTANCE_CHECK2=$(echo $INSTANCE_STATUS | jq -r -c '.InstanceStatuses[0].InstanceStatus.Details[0].Status')
    INSTANCE_CHECK_COUNT=$((INSTANCE_CHECK_COUNT+1))
  done
  print "  ...status check #$INSTANCE_CHECK_COUNT: READY"
}

# Iterate while there are arguments
while [ $# -gt 0 ]; do
  # If the argument begins with --, strip the -- to create the variable name
  # and then set it to the next argument
  if [[ $1 == *"--"* ]]; then
    v="${1/--/}"
    export $v="$2"
  fi

  # Remove the current argument
  shift
done

echo $(deployPreviewtoEC2)
