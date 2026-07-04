# Manual Setup Steps for AWS Deployment

Before running the Terraform configuration, there are a few manual steps you need to perform. AWS recruiters love to see these steps documented because it shows you understand the practical flow of container deployment and AWS access management.

---

## 1. Setup AWS CLI & Local Credentials

Terraform needs permissions to create resources in your `eu-north-1` region.

1. Install the AWS CLI on your local machine.
2. Run the configuration command in your terminal:
   ```bash
   aws configure
   ```
3. Enter your:
   * **AWS Access Key ID**
   * **AWS Secret Access Key**
   * **Default region name**: `eu-north-1`
   * **Default output format**: `json`

---

## 2. Create the ECR Repository & Push your Docker Image

Terraform's ECS task definition relies on your FastAPI Docker image being hosted in Amazon ECR. Because Terraform needs the image to exist *before* it creates the ECS service, you must build and push it first.

1. **Create the ECR Repository** (you can do this via the AWS Console or AWS CLI):
   ```bash
   aws ecr create-repository --repository-name resume-tracker-app --region eu-north-1
   ```
2. **Retrieve the ECR login password** and authenticate your local Docker client:
   ```bash
   aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com
   ```
3. **Build the Docker Image** (run this from your local `App/` directory):
   ```bash
   cd App
   docker build -t resume-tracker-app .
   ```
4. **Tag the Docker Image** for ECR:
   ```bash
   docker tag resume-tracker-app:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/resume-tracker-app:latest
   ```
5. **Push the Image** to your AWS repository:
   ```bash
   docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/resume-tracker-app:latest
   ```

---

## 3. Set Up Variables in `terraform.tfvars`

Now that your container image is live in ECR, supply the configuration values to Terraform:

1. Create a `terraform.tfvars` file:
   ```bash
   cd deployment/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Open `terraform.tfvars` and update the values:
   * Set your ECR URL: `ecr_repo_url = "YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/resume-tracker-app"`
   * Set your private `db_password` and JWT `jwt_secret_key`.

---

## 4. Run Terraform to Deploy the Rest

Now you are ready to deploy the database, network, ALB, and ECS service:

```bash
terraform init
terraform plan
terraform apply
```

*(Once it completes, Terraform will output the Application Load Balancer DNS name. You can visit that URL in your browser to access the backend API!)*
