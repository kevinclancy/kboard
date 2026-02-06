terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Store Terraform state in S3 (optional, can use local for now)
  # backend "s3" {
  #   bucket = "docker-compose-brokenjaw"
  #   key    = "terraform/state.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
