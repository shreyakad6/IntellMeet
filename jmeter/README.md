# Apache JMeter Load Testing Suite for IntellMeet

This directory contains automated load testing configurations for benchmark testing IntellMeet's REST endpoints, health probes, and authentication services under concurrent user workloads.

## Test Plan Structure
The provided test plan (`intellmeet-load-test.jmx`) benchmarks:
1. `GET /health` service readiness
2. `POST /api/auth/login` authentication throughput and JWT signing overhead
3. Concurrent thread ramping (50 virtual users with 10s ramp-up)

## Prerequisites
- Apache JMeter 5.5+ installed (`jmeter` binary in PATH) or Dockerized JMeter.
- IntellMeet backend server running on `http://localhost:5000`.

## Running the Load Test via CLI (Headless Mode)
Execute the non-GUI test with HTML dashboard generation:

```bash
jmeter -n -t intellmeet-load-test.jmx -l results.jtl -e -o ./report
```

## Running via Docker
If JMeter is not locally installed, run via official Docker container:

```bash
docker run --rm -v $(pwd):/tests -w /tests justb4/jmeter -n -t intellmeet-load-test.jmx -l results.jtl
```

## Expected Performance Benchmarks
- Health check endpoint latency: `< 10ms` (p95)
- Login endpoint latency (bcrypt verification): `< 250ms` (p95)
- Success Rate: `> 99.5%` under rated concurrency limits
