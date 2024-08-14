#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { JobAlertServiceStack } from '../lib/job_alert_service-stack';

const app = new cdk.App();
new JobAlertServiceStack(app, 'JobAlertServiceStack', {
    env: {
        account: '767398124820',
        region: 'eu-west-1',
    }
});