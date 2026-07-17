terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
provider "aws" {
  region = var.aws_region
}
# Hardcoded AMI to avoid requiring ec2:DescribeImages permission.
# AMI: al2023-ami-2023.12.20260710.0-kernel-6.18-x86_64 (ap-south-1, fetched 2026-07-17)
locals {
  amazon_linux_2023_ami = "ami-0b910d1016287a5e7"
}
resource "aws_s3_bucket" "documents" {
  bucket        = var.s3_bucket_name
  force_destroy = false
  tags = { Name = "docusense-documents" }
}
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
resource "aws_iam_role" "ec2_role" {
  name = "docusense-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}
resource "aws_iam_role_policy" "s3_access" {
  name = "docusense-s3-access"
  role = aws_iam_role.ec2_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"]
      Resource = [
        aws_s3_bucket.documents.arn,
        "${aws_s3_bucket.documents.arn}/*"
      ]
    }]
  })
}
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "docusense-ec2-profile"
  role = aws_iam_role.ec2_role.name
}
resource "aws_security_group" "docusense" {
  name        = "docusense-sg"
  description = "DocuSense: allow HTTP from anywhere, SSH from your IP only"
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "docusense-sg" }
}
resource "aws_key_pair" "deployer" {
  key_name   = "docusense-key"
  public_key = var.ssh_public_key
}
resource "aws_instance" "docusense" {
  ami                    = local.amazon_linux_2023_ami
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.docusense.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }
  user_data = templatefile("${path.module}/user_data.sh", {
    REPO_URL                  = var.repo_url
    MONGO_URI                 = var.mongo_uri
    JWT_ACCESS_SECRET         = var.jwt_access_secret
    JWT_REFRESH_SECRET        = var.jwt_refresh_secret
    PENDING_ROLE_TOKEN_SECRET = var.pending_role_token_secret
    CLIENT_ORIGIN             = "http://${aws_eip.docusense.public_ip}"
    S3_REGION                 = var.aws_region
    S3_BUCKET                 = var.s3_bucket_name
    S3_ACCESS_KEY_ID          = ""
    S3_SECRET_ACCESS_KEY      = ""
    GEMINI_API_KEY            = var.gemini_api_key
    GOOGLE_CLIENT_ID          = var.google_client_id
    GOOGLE_CLIENT_SECRET      = var.google_client_secret
  })
  tags = { Name = "docusense" }
}
resource "aws_eip" "docusense" {
  domain = "vpc"
}
resource "aws_eip_association" "docusense" {
  instance_id   = aws_instance.docusense.id
  allocation_id = aws_eip.docusense.id
}
