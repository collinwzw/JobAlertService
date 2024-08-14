import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class JobAlertServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    const pipeline = new CodePipeline(this, 'JobAlertServicePipeline', {
      pipelineName: 'JobAlertServicePipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('collinwzw/JobAlertService', 'main', {
          authentication: cdk.SecretValue.secretsManager('GITHUB_TOKEN_SECRET_NAME')
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    pipeline.addStage(new LambdaDeploymentStage(this, 'Deploy'));
  }
}

class LambdaDeploymentStage extends cdk.Stage {

  constructor(scope: Construct, id: string) {
    super(scope, id);
    new LambdaDeploymentStack(this, 'LambdaDeploymentStack');
  }
}

class LambdaDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const lambdaFunction = new lambdaPython.PythonFunction(this, 'JobAlertFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      entry: 'lambda/job_alert_service_function',
      functionName: 'JobAlertServiceLambdaFunction'
    });

    const api = new apigateway.LambdaRestApi(this, 'JobAlertApi', {
      handler: lambdaFunction,
      proxy: false
    });

    // Define API resources and methods
    const jobAlertResource = api.root.addResource('job-alert');
    jobAlertResource.addMethod('POST');  // POST /job-alert triggers the Lambda
  }
}
