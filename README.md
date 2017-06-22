# AWS Lambda - Auto Turn on/off ec2 instance

An AWS Lmabda Funtion to manage EC2 instance action automatically. This will be helpful to save your cost for unnecessary running.

## Installation

### Install dependancies 

```sh
$ cd email-forwarder
$ npm install
```

Zip folder and upload it to Lambda function

### Configure Lambda

```
INSTANCE_NAME = your instance name
AUTO_SCALING_GROUP_NAME = autoscaling group name attached to your EBS environment
```

Here if you didn't change current instance name, instance name will be EBS environment name.
