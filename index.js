var AWS = require('aws-sdk');



exports.handler = function(event, context, callback) {
    var ec2 = new AWS.EC2({region: 'us-east-1'});
    var autoScaling = new AWS.AutoScaling({region: 'us-east-1'});
    
    console.log('Triggered!!!');

    ec2.describeInstances(function(err, data) {
        if (err) {
            return reject(err);
        }
        
        var instanceID = null;
        var isRunning = false;
        
        for (var k = 0; k < data.Reservations.length; k ++) {
            
            var reservation = data.Reservations[k];
            for (var i = 0; i < reservation.Instances[0].Tags.length - 1; i ++) {
                if (reservation.Instances[0].Tags[i].Key === 'Name' && 
                    reservation.Instances[0].Tags[i].Value === process.env.INSTANCE_NAME) {
                    
                    var validStatuses = ['running', 'stopped'];
                    isRunning = validStatuses.indexOf(reservation.Instances[0].State.Name) !== -1 ? reservation.Instances[0].State.Name === 'running' : false;
                    instanceID = validStatuses.indexOf(reservation.Instances[0].State.Name) !== -1 ? reservation.Instances[0].InstanceId : null;
                }
                
                if (instanceID) {
                    break;
                }
            }
            
            if (instanceID) {
                break;
            }
        }
        
        if (instanceID && isRunning) {
            // instance is alive
            console.log('Stopping Instances...');
            stopInstance(instanceID);
            
        } else if (!instanceID) {
            // instance is terminated
            console.log('Starting Instances...');
            startInstance(instanceID);
            
        } else {
            console.log('Blank end');   
        }
    });
    
    function startInstance(instanceID) {
        
        var updateScalingParams = {
            AutoScalingGroupName: process.env.AUTO_SCALING_GROUP_NAME, 
            MaxSize: 4, 
            MinSize: 1
        };
        
        autoScaling.updateAutoScalingGroup(updateScalingParams, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                
                console.log('AutoScaling Group MinSize is set to 1');
                
                // attaching instance to AutoScaling Group for starting instances
                autoScaling.setDesiredCapacity({
                    AutoScalingGroupName: process.env.AUTO_SCALING_GROUP_NAME, 
                    DesiredCapacity: 1
                }, function(err, data) {
                    if (err) {
                        // an error occurred
                        console.log(err, err.stack);
                    } else {
                        // successful response
                        console.log('Instance started');
                        context.done(err,data);
                    }
                });
            }
        });
    }
    
    function stopInstance(instanceID) {
        // set minimum capacity to 0 so to remove instances
        
        var updateScalingParams = {
            AutoScalingGroupName: process.env.AUTO_SCALING_GROUP_NAME, 
            MaxSize: 4, 
            MinSize: 0
        };
        
        autoScaling.updateAutoScalingGroup(updateScalingParams, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                
                console.log('AutoScaling Group MinSize is set to 0');
                
                // detaching instance before stopping to prevent restart
                
                var detachParams = {
                    AutoScalingGroupName: process.env.AUTO_SCALING_GROUP_NAME,
                    InstanceIds: [
                        instanceID
                    ],
                    ShouldDecrementDesiredCapacity: true
                };
                
                autoScaling.detachInstances(detachParams, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                    } else {
                        console.log('Instance detached from AutoScaling Group');
                        // stop instance
                        ec2.terminateInstances({InstanceIds : [instanceID] },function (err, data) {
                            if (err) {
                                console.log(err, err.stack); // an error occurred
                            } else {
                                console.log('Instance terminated');
                                context.done(err,data);
                            }
                        });
                    }
                });
            }
        });
    }
};