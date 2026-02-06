variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed to SSH into the instance"
  type        = string
  default     = "172.92.100.59/32" # Your current IP
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "BrokenJawKey"
}
