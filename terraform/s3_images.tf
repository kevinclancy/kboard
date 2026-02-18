resource "aws_s3_bucket" "images" {
  bucket = "kboard-images-brokenjaw"

  tags = {
    Name        = "KBoard Images Bucket"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = [
      "https://brokenjaw.net",
      "http://localhost",
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Public access must be unblocked for the bucket policy to allow public reads
resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Allow public read on the replies/ prefix only
resource "aws_s3_bucket_policy" "images_public_read" {
  bucket     = aws_s3_bucket.images.id
  depends_on = [aws_s3_bucket_public_access_block.images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadRepliesImages"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/replies/*"
      }
    ]
  })
}

# Auto-delete abandoned pending uploads after 1 day
resource "aws_s3_bucket_lifecycle_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  rule {
    id     = "cleanup-pending-uploads"
    status = "Enabled"

    filter {
      prefix = "pending/"
    }

    expiration {
      days = 1
    }
  }
}
