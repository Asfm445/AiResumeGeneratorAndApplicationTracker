output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "The public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "The database hostname/endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  description = "The Redis caching endpoint address"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "sqs_queue_url" {
  description = "The SQS Queue URL for embedding task workers"
  value       = aws_sqs_queue.embedding_queue.url
}
