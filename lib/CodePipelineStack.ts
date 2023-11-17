import * as cdk from "aws-cdk-lib";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as pln from "aws-cdk-lib/aws-codepipeline";
import * as plnActions from "aws-cdk-lib/aws-codepipeline-actions";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class CodePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repo = new codecommit.Repository(this, "CodeRepo", {
      repositoryName: "react-app",
    });

    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
    });

    const sourceOutput = new pln.Artifact("SourceArtifact");

    const reactAppSource = new plnActions.CodeCommitSourceAction({
      actionName: "ReactAppCommit",
      repository: repo,
      branch: "main",
      output: sourceOutput,
      trigger: plnActions.CodeCommitTrigger.EVENTS,
    });

    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      projectName: "ReactAppBuildProject",
      buildSpec: codebuild.BuildSpec.fromSourceFilename("./buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
    });

    const buildOutput = new pln.Artifact("BuildArtifact");

    const reactAppBuild = new plnActions.CodeBuildAction({
      actionName: "ReactAppBuild",
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
    });
    
    const reactAppDeployToS3 = new plnActions.S3DeployAction({
      actionName: "ReactAppDeployToS3",
      bucket: websiteBucket,
      input: buildOutput,
    });

    new pln.Pipeline(this, "ReactAppPipeline", {
      pipelineName: "ReactAppPipeline",
      crossAccountKeys: false,
      stages: [
        {
          stageName: "Source",
          actions: [reactAppSource],
        },
        {
          stageName: "Build",
          actions: [reactAppBuild],
        },
        {
          stageName: "Deploy",
          actions: [reactAppDeployToS3],
        },
      ],
      artifactBucket,
    });
  }
}
