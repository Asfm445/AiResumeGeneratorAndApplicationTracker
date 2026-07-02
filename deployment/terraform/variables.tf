variable "aws_region" {
  type        = string
  description = "AWS Target Region"
  default     = "eu-north-1"
}

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "resumedb"
}

variable "db_username" {
  type        = string
  description = "Database admin username"
  default     = "dbadmin"
}

variable "db_password" {
  type        = string
  description = "Database admin password"
  sensitive   = true
}

variable "jwt_secret_key" {
  type        = string
  description = "JWT encryption key"
  sensitive   = true
}

variable "ecr_repo_url" {
  type        = string
  description = "Amazon ECR repository URL containing the backend FastAPI image"
  default     = "123456789012.dkr.ecr.eu-north-1.amazonaws.com/resume-tracker-app"
}
