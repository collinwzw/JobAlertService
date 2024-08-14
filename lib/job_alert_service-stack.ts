import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class JobAlertServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const jobAlertServiceLambda = new lambdaPython.PythonFunction(this, 'JobAlertFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      entry: 'lambda/job_alert_service_function',
    });

    const pipeline = new CodePipeline(this, 'JobAlertServicePipeline', {
      pipelineName: 'JobAlertServicePipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('collinwzw/JobAlertService', 'main', {
          authentication: cdk.SecretValue.secretsManager('GITHUB_TOKEN_SECRET_NAME')
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    pipeline.addStage(new LambdaDeploymentStage(this, 'Deploy', {
      lambdaFunction: jobAlertServiceLambda,
    }));
  }
}

class LambdaDeploymentStage extends cdk.Stage {
  public readonly lambdaFunction: lambda.IFunction;

  constructor(scope: Construct, id: string, props: { lambdaFunction: lambda.IFunction }) {
    super(scope, id);

    // Pass the lambda function
    this.lambdaFunction = props.lambdaFunction;

    new LambdaDeploymentStack(this, 'LambdaDeploymentStack', {
      lambdaFunction: this.lambdaFunction,
    });
  }
}

class LambdaDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: { lambdaFunction: lambda.IFunction }) {
    super(scope, id);

    const { lambdaFunction } = props;

    const api = new apigateway.LambdaRestApi(this, 'JobAlertApi', {
      handler: lambdaFunction,
      proxy: false
    });

    const jobAlertResource = api.root.addResource('job-alert');
    jobAlertResource.addMethod('POST');  // POST /job-alert triggers the Lambda
  }
}
