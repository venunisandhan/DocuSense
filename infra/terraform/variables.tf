variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "my_ip_cidr" {
  description = "Your public IP in CIDR notation for SSH access, e.g. 123.45.67.89/32"
  type        = string
}

variable "ssh_public_key" {
  description = "Contents of your ~/.ssh/id_rsa.pub or id_ed25519.pub"
  type        = string
}

variable "repo_url" {
  description = "GitHub HTTPS URL of the DocuSense repo"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name — must be globally unique"
  type        = string
}

variable "mongo_user" {
  description = "MongoDB root username"
  type        = string
  default     = "root"
}

variable "mongo_password" {
  description = "MongoDB root password"
  type        = string
  sensitive   = true
}

variable "jwt_access_secret" {
  description = "Secret for signing access tokens"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "Secret for signing refresh tokens"
  type        = string
  sensitive   = true
}

variable "pending_role_token_secret" {
  description = "Secret for Google OAuth pending-role tokens"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}
