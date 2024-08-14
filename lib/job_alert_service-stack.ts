import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class JobAlertServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('collinwzw/JobAlertService', 'main', {
          authentication: cdk.SecretValue.secretsManager('GITHUB_TOKEN_SECRET_NAME')
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });
  }
}
