resource "aws_s3_bucket" "terraform_state" {
  bucket = "eapd-terraform-state"
  # Enable versioning so we can see the full revision history of our
  # state files
  versioning {
    enabled = true
  }
  # Enable server-side encryption by default
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

### Potential future use, allows for resource locking to prevent collisions from multiple users 
#resource "aws_dynamodb_table" "terraform_locks" {
#  name         = "eapd-terraform-state-locks"
#  billing_mode = "PAY_PER_REQUEST"
#  hash_key     = "LockID"
#  attribute {
#    name = "LockID"
#    type = "S"
#  }
#}
