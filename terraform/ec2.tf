data "aws_vpc" "default" {
  default = true
}

data "aws_subnet" "selected" {
  id = "subnet-0b428e5c214e21b89"
}

resource "aws_instance" "web_server" {
  ami                    = "ami-0de716d6197524dd9" # Ubuntu in us-east-1
  instance_type          = var.instance_type
  key_name              = var.key_name
  subnet_id             = data.aws_subnet.selected.id
  vpc_security_group_ids = [aws_security_group.web_server.id]

  iam_instance_profile = aws_iam_instance_profile.ssm_profile.name

  root_block_device {
    volume_type           = "gp3"
    delete_on_termination = true
  }

  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    http_endpoint              = "enabled"
    http_protocol_ipv6         = "disabled"
    instance_metadata_tags     = "disabled"
  }

  tags = {
    Name = "Broken Jaw Server"
  }
}
