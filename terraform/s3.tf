resource "aws_s3_bucket" "deployment" {
  bucket = "docker-compose-brokenjaw"

  tags = {
    Name        = "Deployment Bucket"
    Environment = "Production"
  }
}

# Enable versioning for deployment bucket
resource "aws_s3_bucket_versioning" "deployment" {
  bucket = aws_s3_bucket.deployment.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "deployment" {
  bucket = aws_s3_bucket.deployment.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
