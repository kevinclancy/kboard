output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.web_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.web_server.public_dns
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.web_server.id
}

output "deployment_bucket_name" {
  description = "S3 deployment bucket name"
  value       = aws_s3_bucket.deployment.bucket
}
