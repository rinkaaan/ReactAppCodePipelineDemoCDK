# React App CodePipeline Demo CDK

This demo creates a CodePipeline with three stages: Source, Build, and Deploy. The source stage is a CodeCommit repository. The build stage uses CodeBuild to build the React app. The deploy stage takes the build artifact and deploys it to an S3 bucket.

[Source tutorial](https://www.cloudtechsimplified.com/beginners-guide-to-aws-codepipeline-ci-cd/)

1. Run `cdk deploy`
2. Do a `git push` from the `ReactAppCodePipelineDemoStaticAssets` git repo to the CodeCommit repo
3. The CodePipeline should start and deploy the React app to the S3 bucket
4. Run `cdk destroy`
