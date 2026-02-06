resource "aws_security_group" "web_server" {
  name        = "launch-wizard-5"
  description = "launch-wizard-5 created 2025-08-18T23:13:49.947Z"
  vpc_id      = data.aws_vpc.default.id

  # SSH access from specific IP
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
    description = "SSH access"
  }

  # HTTP access from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS access from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # Custom application port (Loco backend)
  ingress {
    from_port   = 5150
    to_port     = 5150
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Loco application port"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "Broken Jaw Server Security Group"
  }
}
