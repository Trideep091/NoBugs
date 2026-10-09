import os
import random
import datetime

def generate_logs(total_lines=10000, output_path="backend/data/sample_incident_10k.log"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    start_time = datetime.datetime(2026, 10, 10, 3, 0, 0)
    lines = []

    # Distribution of lines across the 10-minute window
    # 03:00 to 03:10 (600 seconds)
    print(f"Generating {total_lines} realistic cascading multi-service log lines...")

    # Template definitions
    # Baseline noise (approx 45% of logs)
    noise_templates = [
        ("api-gateway", "INFO", "HTTP 200 GET /healthz 2ms client_ip={ip}"),
        ("auth", "INFO", "JWT token validated for subject user_{uid} with bearer Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSJ9.signature123"),
        ("checkout", "INFO", "Cart refreshed cart_{cart_id} item_count={items}"),
        ("cache", "INFO", "Cache hit key session_{uid} latency={lat}ms"),
        ("db", "INFO", "Vacuum completed on table orders in 12ms"),
        ("payment", "INFO", "Ping payment gateway provider status=ACTIVE latency=42ms"),
        ("auth", "INFO", "API key authenticated for client service={svc} key=sk_live_984f8392019485720192"),
    ]

    # Red herring (approx 8% of logs, starts at 03:02:00)
    red_herring_templates = [
        ("cache", "WARN", "Cache miss spike on key user_session:{uid}, falling back to primary replica"),
        ("cache", "WARN", "Redis memory usage threshold warning: memory at 78.4% capacity for cluster cache-01"),
    ]

    # Incident cascade:
    # 1. DB onset (03:03:00+)
    db_onset_templates = [
        ("db", "WARN", "Connection pool acquisition latency spike: acquired connection in {db_lat}ms for host 10.0.4.12:5432"),
        ("db", "ERROR", "Connection pool acquisition timeout after 5000ms for host postgres-primary-01.internal"),
        ("db", "ERROR", "Query execution failed: canceling statement due to statement timeout after 10000ms on table account_ledgers"),
    ]

    # 2. Payment failure (03:04:15+)
    payment_templates = [
        ("payment", "ERROR", "Payment provider transaction RPC timeout: db_unreachable after 30000ms for tx_{tx_id} card=411122223333{card_tail} email=customer_{uid}@example.com"),
        ("payment", "CRITICAL", "Payment circuit breaker tripped to OPEN state for provider stripe-direct: error threshold 80% exceeded"),
        ("payment", "ERROR", "Failed to capture authorization tx_{tx_id}: connection refused by upstream db"),
    ]

    # 3. Checkout failure (03:05:00+)
    checkout_templates = [
        ("checkout", "ERROR", "Checkout service received HTTP 503 Service Unavailable from upstream payment-svc for cart_{cart_id}"),
        ("checkout", "ERROR", "Order checkout processing aborted: downstream payment timeout after 15000ms"),
        ("checkout", "WARN", "Retrying payment charge attempt 2/3 for cart_{cart_id} failed"),
    ]

    # 4. API Gateway failure (03:05:30+)
    gateway_templates = [
        ("api-gateway", "ERROR", "Order submission failed: checkout upstream 503 on route /api/v2/orders/submit for user_{uid}"),
        ("api-gateway", "CRITICAL", "Rate of 5xx errors exceeded alert threshold (5.8% > 1.0%) on cluster edge-us-east"),
        ("api-gateway", "ERROR", "Client request terminated with status 503: upstream server unavailable"),
    ]

    for i in range(total_lines):
        # Progress timestamp across 600 seconds
        t_sec = int((i / total_lines) * 600)
        curr_time = start_time + datetime.timedelta(seconds=t_sec)
        ts_str = curr_time.strftime("%Y-%m-%d %H:%M:%S")

        ip = f"10.0.{random.randint(1, 20)}.{random.randint(2, 250)}"
        uid = random.randint(1000, 9999)
        cart_id = f"crt_{random.randint(10000, 99999)}"
        tx_id = f"tx_{random.randint(100000, 999999)}"
        card_tail = f"{random.randint(1000, 9999)}"
        items = random.randint(1, 8)
        lat = random.randint(1, 15)
        db_lat = random.randint(3100, 4900)
        svc = random.choice(["checkout", "order-svc", "payment"])

        # Decide log category based on timeline
        rand_val = random.random()

        if t_sec < 120:
            # Baseline only
            service, level, msg_pattern = random.choice(noise_templates)
        elif t_sec < 180:
            # Baseline + red herring
            if rand_val < 0.25:
                service, level, msg_pattern = random.choice(red_herring_templates)
            else:
                service, level, msg_pattern = random.choice(noise_templates)
        elif t_sec < 255:
            # DB onset begins
            if rand_val < 0.35:
                service, level, msg_pattern = random.choice(db_onset_templates)
            elif rand_val < 0.45:
                service, level, msg_pattern = random.choice(red_herring_templates)
            else:
                service, level, msg_pattern = random.choice(noise_templates)
        elif t_sec < 310:
            # Payment starts cascading
            if rand_val < 0.30:
                service, level, msg_pattern = random.choice(payment_templates)
            elif rand_val < 0.55:
                service, level, msg_pattern = random.choice(db_onset_templates)
            elif rand_val < 0.65:
                service, level, msg_pattern = random.choice(red_herring_templates)
            else:
                service, level, msg_pattern = random.choice(noise_templates)
        elif t_sec < 340:
            # Checkout cascade
            if rand_val < 0.25:
                service, level, msg_pattern = random.choice(checkout_templates)
            elif rand_val < 0.45:
                service, level, msg_pattern = random.choice(payment_templates)
            elif rand_val < 0.65:
                service, level, msg_pattern = random.choice(db_onset_templates)
            else:
                service, level, msg_pattern = random.choice(noise_templates)
        else:
            # Full cascade hitting API Gateway customer orders
            if rand_val < 0.28:
                service, level, msg_pattern = random.choice(gateway_templates)
            elif rand_val < 0.52:
                service, level, msg_pattern = random.choice(checkout_templates)
            elif rand_val < 0.72:
                service, level, msg_pattern = random.choice(payment_templates)
            elif rand_val < 0.88:
                service, level, msg_pattern = random.choice(db_onset_templates)
            else:
                service, level, msg_pattern = random.choice(noise_templates)

        msg = msg_pattern.format(
            ip=ip, uid=uid, cart_id=cart_id, tx_id=tx_id,
            card_tail=card_tail, items=items, lat=lat, db_lat=db_lat, svc=svc
        )

        log_line = f"{ts_str} {level} [{service}] {msg}"
        lines.append(log_line)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Successfully generated {len(lines)} lines at {output_path}")

if __name__ == "__main__":
    generate_logs()
