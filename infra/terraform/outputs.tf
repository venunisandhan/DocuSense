output "public_ip" {
  description = "Elastic IP of the EC2 instance"
  value       = aws_eip.docusense.public_ip
}

output "app_url" {
  description = "URL to open the app in the browser"
  value       = "http://${aws_eip.docusense.public_ip}"
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh -i ~/.ssh/docusense_key ec2-user@${aws_eip.docusense.public_ip}"
}

output "s3_bucket" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.documents.id
}
