#!/bin/bash
# Configure CloudWatch Agent
touch /opt/aws/amazon-cloudwatch-agent/doc/cwagent.json
cat <<CWAGENTCONFIG > /opt/aws/amazon-cloudwatch-agent/doc/cwagent.json
{
	"agent": {
		"metrics_collection_interval": 60,
		"run_as_user": "cwagent"
	},
	"metrics": {
		"aggregation_dimensions": [
			[
				"InstanceId"
			]
		],
		"append_dimensions": {
			"AutoScalingGroupName": "${aws:AutoScalingGroupName}",
			"ImageId": "${aws:ImageId}",
			"InstanceId": "${aws:InstanceId}",
			"InstanceType": "${aws:InstanceType}"
		},
		"metrics_collected": {
			"collectd": {
				"metrics_aggregation_interval": 60
			},
			"disk": {
				"measurement": [
					"used_percent"
				],
				"metrics_collection_interval": 60,
				"resources": [
					"*"
				]
			},
			"mem": {
				"measurement": [
					"mem_used_percent"
				],
				"metrics_collection_interval": 60
			},
			"statsd": {
				"metrics_aggregation_interval": 60,
				"metrics_collection_interval": 10,
				"service_address": ":8125"
			}
		}
	}
}

CWAGENTCONFIG

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/doc/cwagent.json

sudo yum install -y gcc-c++

# Test to see the command that is getting built for pulling the Git Branch
sudo su - ec2-user <<E_USER
# The su block begins inside the root user's home directory.  Switch to the
# ec2-user home directory.
cd ~
# Prepare the environment
export OKTA_DOMAIN="__OKTA_DOMAIN__"
export OKTA_SERVER_ID="__OKTA_SERVER_ID__"
export OKTA_CLIENT_ID="__OKTA_CLIENT_ID__"
export OKTA_API_KEY="__OKTA_API_KEY__"
export JWT_SECRET="__JWT_SECRET__"
export MONGO_DATABASE="__MONGO_DATABASE__"
export MONGO_URL="__MONGO_URL__"
export MONGO_ADMIN_URL="__MONGO_ADMIN_URL__"
export MONGO_INITDB_ROOT_USERNAME="__MONGO_INITDB_ROOT_USERNAME__"
export MONGO_INITDB_ROOT_PASSWORD="__MONGO_INITDB_ROOT_PASSWORD__"
export MONGO_INITDB_DATABASE="__MONGO_INITDB_DATABASE__"
export MONGO_DATABASE_USERNAME="__MONGO_DATABASE_USERNAME__"
export MONGO_DATABASE_PASSWORD="__MONGO_DATABASE_PASSWORD__"
export DATABASE_URL="__DATABASE_URL__"
sudo sh -c "echo license_key: '__NEW_RELIC_LICENSE_KEY__' >> /etc/newrelic-infra.yml"


# Clone from Github
git clone --single-branch -b __GIT_BRANCH__ https://github.com/CMSgov/eAPD.git
# Build the web app and move it into place
cd eAPD
npm i -g yarn@1.22.18
yarn cache clean
yarn install --frozen-lockfile --non-interactive --production --network-timeout 1000000 > yarn-install.log

cd web
WEB_ENV="dev" API_URL=/api TEALIUM_TAG="__TEALIUM_TAG__" OKTA_DOMAIN="__OKTA_DOMAIN__" OKTA_SERVER_ID="__OKTA_SERVER_ID__" OKTA_CLIENT_ID="__OKTA_CLIENT_ID__" yarn build

cp -r dist/* /app/web

# move over node modules
cd ~/eAPD
mkdir -p /app/node_modules
cp -r ~/eAPD/node_modules/* /app/node_modules

# Move the API code into place, then go set it up
cp -r ~/eAPD/api/* /app/api
cd /app/api

# Build and seed the database
NODE_ENV=development DEV_DB_HOST=localhost yarn run migrate
NODE_ENV=development DEV_DB_HOST=localhost yarn run seed

# Setting Up New Relic Application Monitor
yarn add newrelic --save
cp node_modules/newrelic/newrelic.js ./newrelic.js
sed -i 's|My Application|eAPD API|g' newrelic.js
sed -i 's|license key here|__NEW_RELIC_LICENSE_KEY__|g' newrelic.js
sed -i "1 s|^|require('newrelic');\n|" main.js

sudo chown -R ec2-user:eapd /app

# pm2 wants an ecosystem file that describes the apps to run and sets any
# environment variables they need.  The environment variables are sensitive,
# so we won't put them here.  Instead, the CI/CD process should replace
# "__ECOSYSTEM__" with a base64-encoded JSON string of an ecosystem file.
echo "module.exports = {
  apps : [{
    name: 'eAPD API',
    script: 'main.js',
    instances: 1,
    autorestart: true,
    error_file: '/app/api/logs/eAPD-API-error-0.log',
    out_file: '/app/api/logs/eAPD-API-out-0.log',
    env: {
      AUTH_LOCK_FAILED_ATTEMPTS_COUNT: 15,
      AUTH_LOCK_FAILED_ATTEMPTS_WINDOW_TIME_MINUTES: 1,
      AUTH_LOCK_FAILED_ATTEMPTS_DURATION_MINUTES: 10,
      FILE_PATH: '__files',
      FILE_STORE: 'local',
      NODE_ENV: 'development',
      PBKDF2_ITERATIONS: '__PBKDF2_ITERATIONS__',
      PORT: '8000',
      DEV_DB_HOST: 'localhost',
      DISABLE_SAME_SITE: 'yes',
      OKTA_DOMAIN: '__OKTA_DOMAIN__',
      OKTA_SERVER_ID: '__OKTA_SERVER_ID__',
      OKTA_CLIENT_ID: '__OKTA_CLIENT_ID__',
      OKTA_API_KEY: '__OKTA_API_KEY__',
      JWT_SECRET: '__JWT_SECRET__',
      MONGO_DATABASE: '__MONGO_DATABASE__',
      MONGO_URL: '__MONGO_URL__',
      MONGO_ADMIN_URL: '__MONGO_ADMIN_URL__',
      DATABASE_URL: '__DATABASE_URL__',
    },
  }]
};" > ecosystem.config.js
# Start it up
pm2 start ecosystem.config.js
pm2 save

NODE_ENV=production MONGO_URL=$MONGO_URL DATABASE_URL=$DATABASE_URL OKTA_DOMAIN=$OKTA_DOMAIN OKTA_API_KEY=$OKTA_API_KEY yarn run migrate
E_USER

sudo yum remove -y gcc-c++

# SELinux context so Nginx can READ the files in /app/web
mv /home/ec2-user/nginx.conf.tpl /etc/nginx/nginx.conf
chown -R nginx /app/web
semanage fcontext -a -t httpd_sys_content_t /etc/nginx/nginx.conf
restorecon -Rv /etc/nginx/nginx.conf
semanage fcontext -a -t httpd_sys_content_t "/app/web(/.*)?"
restorecon -Rv /app/web
setsebool -P httpd_can_network_connect 1

# Restart Nginx
systemctl enable nginx
systemctl restart nginx

# Restart New Relic Infrastructure Monitor
systemctl enable newrelic-infra
systemctl start newrelic-infra

# Setup pm2 to start itself at machine launch, and save its current
# configuration to be restored when it starts
su - ec2-user -c '~/.bash_profile; sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v16.15.0/bin /home/ec2-user/.nvm/versions/node/v16.15.0/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user'
su - ec2-user -c 'pm2 save'
su - ec2-user -c 'pm2 restart "eAPD API"'
