### Will function like main.tf for Staging ###
terraform {
  backend "s3" {
    bucket         = "eapd-terraform-state"
    key            = "eapd_staging_terraform.tfstate"
    region         = "us-east-1"
    ### Potential future use, allows for resource locking to prevent collisions from multiple users 
    # Replace this with your DynamoDB table name!
    #dynamodb_table = "terraform-up-and-running-locks"
    #encrypt        = true
  }
  required_version = "~> 1.2.4"
}

provider "aws" {
    region = "us-east-1"
    profile = ""
}

module "eAPD" {
    source = "./modules"
    instance_name = var.instance_name
    newrelic_liscense_key = var.newrelic_liscense_key
}