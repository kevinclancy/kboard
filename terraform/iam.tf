# IAM role for EC2 instance to use SSM
resource "aws_iam_role" "ssm_role" {
  name = "SSMPolicy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "SSM Access Role for EC2"
  }
}

# Attach AWS managed policy for SSM
resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach policy for S3 access (for deployment bucket)
resource "aws_iam_role_policy" "s3_deployment_access" {
  name = "S3DeploymentAccess"
  role = aws_iam_role.ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.deployment.arn,
          "${aws_s3_bucket.deployment.arn}/*"
        ]
      }
    ]
  })
}

# Instance profile to attach role to EC2
resource "aws_iam_instance_profile" "ssm_profile" {
  name = "SSMPolicy"
  role = aws_iam_role.ssm_role.name
}
