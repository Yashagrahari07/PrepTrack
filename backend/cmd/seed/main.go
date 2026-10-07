package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Subtopic struct {
	Title string
}

type Topic struct {
	Title     string
	Subtopics []Subtopic
}

type Category struct {
	Name     string
	Color    string
	Position int
	Topics   []Topic
}

var curriculum = []Category{
	{
		Name:     "Backend Engineering",
		Color:    "#6366f1",
		Position: 1,
		Topics: []Topic{
			{
				Title: "HTTP & REST Fundamentals",
				Subtopics: []Subtopic{
					{"Client-Server Request/Response Lifecycle"},
					{"HTTP Methods, Headers, Status Codes & CORS"},
					{"REST API Design: Versioning, Pagination, Error Shapes"},
					{"Idempotency & Safe Methods"},
				},
			},
			{
				Title: "Authentication & Session Management",
				Subtopics: []Subtopic{
					{"Sessions vs JWT: Cookie flags, Token storage"},
					{"OAuth2 Basics & Token flows"},
					{"Password hashing: bcrypt, argon2"},
					{"Rate Limiting: Token Bucket, Sliding Window"},
				},
			},
			{
				Title: "Caching Strategies",
				Subtopics: []Subtopic{
					{"Redis In-Memory Caching & Eviction Policies (LRU, LFU)"},
					{"Cache-Aside, Write-Through & Write-Behind patterns"},
					{"Cache Stampede Mitigation (mutex / probabilistic early expiry)"},
					{"TTL Design & Cache Invalidation Strategies"},
				},
			},
			{
				Title: "Message Queues & Async Processing",
				Subtopics: []Subtopic{
					{"RabbitMQ: Exchanges, Queues, Bindings & Acknowledgements"},
					{"Kafka: Topics, Partitions, Consumer Groups, Offsets"},
					{"Idempotent Consumers & Dead Letter Queues (DLQ)"},
					{"At-least-once vs Exactly-once delivery semantics"},
				},
			},
			{
				Title: "Object Storage & File Handling",
				Subtopics: []Subtopic{
					{"AWS S3 vs Cloudflare R2: Bucket operations & IAM policies"},
					{"Presigned URLs for Secure Direct Client Uploads"},
					{"Multipart Uploads for Large Files"},
					{"CDN integration & Cache-Control headers"},
				},
			},
		},
	},
	{
		Name:     "DBMS",
		Color:    "#10b981",
		Position: 2,
		Topics: []Topic{
			{
				Title: "SQL Mastery",
				Subtopics: []Subtopic{
					{"Joins: INNER, LEFT, RIGHT, FULL, CROSS, SELF"},
					{"Aggregations, GROUP BY, HAVING"},
					{"CTEs (WITH clause) & Recursive CTEs"},
					{"Window Functions: ROW_NUMBER, RANK, LAG, LEAD, PARTITION BY"},
					{"Subqueries vs JOINs: Performance trade-offs"},
				},
			},
			{
				Title: "Indexes & Query Performance",
				Subtopics: []Subtopic{
					{"B+ Tree Index Internals & Node Splitting"},
					{"Composite Indexes & Leftmost Prefix Rule"},
					{"Covering Indexes & Index-Only Scans"},
					{"Hash Indexes & when to use them"},
					{"EXPLAIN ANALYZE: Reading query plans, seq scan vs index scan"},
				},
			},
			{
				Title: "Transactions & ACID",
				Subtopics: []Subtopic{
					{"ACID Properties & Write-Ahead Logging (WAL)"},
					{"Isolation Levels: Read Uncommitted → Serializable"},
					{"Anomalies: Dirty Read, Non-repeatable Read, Phantom Read"},
					{"MVCC (Multi-Version Concurrency Control)"},
					{"Row-level & Table-level Locking"},
					{"Deadlocks: Detection, prevention & retry logic"},
				},
			},
			{
				Title: "Database Design & Normalisation",
				Subtopics: []Subtopic{
					{"1NF, 2NF, 3NF & BCNF rules with examples"},
					{"Pragmatic Denormalisation for high-read systems"},
					{"Entity-Relationship Modelling"},
					{"Partitioning: Range, List, Hash"},
				},
			},
		},
	},
	{
		Name:     "DevOps & Cloud",
		Color:    "#f59e0b",
		Position: 3,
		Topics: []Topic{
			{
				Title: "Linux & Git Fundamentals",
				Subtopics: []Subtopic{
					{"Linux process signals, pipes, top/htop, resource monitoring"},
					{"File permissions, systemd services"},
					{"Git workflows: rebase, squash, cherry-pick, reflog"},
					{"Git branching strategies: trunk-based, git-flow"},
				},
			},
			{
				Title: "CI/CD with GitHub Actions",
				Subtopics: []Subtopic{
					{"Workflow syntax: triggers, jobs, steps, secrets"},
					{"Automated testing in CI pipeline"},
					{"Deployment to Render (backend) & Vercel (frontend)"},
					{"Matrix builds & caching dependencies"},
				},
			},
			{
				Title: "Docker Basics",
				Subtopics: []Subtopic{
					{"Dockerfile: multi-stage builds"},
					{"docker run, build, ps, exec, logs"},
					{"Docker Compose for local dev (app + postgres + redis)"},
					{"Container networking & volume mounts"},
				},
			},
			{
				Title: "Nginx & Reverse Proxy",
				Subtopics: []Subtopic{
					{"Nginx as reverse proxy & load balancer config"},
					{"TLS termination at Nginx"},
					{"Rate limiting & connection limiting in Nginx"},
				},
			},
			{
				Title: "Cloud Basics (AWS)",
				Subtopics: []Subtopic{
					{"EC2: Instance types, security groups, key pairs"},
					{"S3: Bucket policies, static hosting, CORS"},
					{"IAM: Users, roles, policies & least-privilege"},
					{"RDS vs managed DB: when to use each"},
				},
			},
		},
	},
	{
		Name:     "Operating Systems",
		Color:    "#ec4899",
		Position: 4,
		Topics: []Topic{
			{
				Title: "Processes & Threads",
				Subtopics: []Subtopic{
					{"Process lifecycle, PCB & context switching overhead"},
					{"Threads vs Processes: memory sharing, isolation"},
					{"User-space vs Kernel-space threads"},
					{"CPU Scheduling: FCFS, SJF, Round Robin, Priority"},
				},
			},
			{
				Title: "Memory Management",
				Subtopics: []Subtopic{
					{"Virtual Memory & address translation"},
					{"Paging & page tables (TLB, page fault handling)"},
					{"Page replacement algorithms: LRU, Clock, Optimal"},
					{"Stack vs Heap: allocation patterns"},
				},
			},
			{
				Title: "Synchronisation & Concurrency",
				Subtopics: []Subtopic{
					{"Race conditions & critical sections"},
					{"Mutex, Semaphores & Monitors"},
					{"Deadlock: Coffman conditions, detection & prevention"},
					{"IPC: Pipes, Message Queues, Shared Memory"},
				},
			},
		},
	},
	{
		Name:     "Computer Networks",
		Color:    "#8b5cf6",
		Position: 5,
		Topics: []Topic{
			{
				Title: "Network Models & Protocols",
				Subtopics: []Subtopic{
					{"OSI vs TCP/IP model: layer responsibilities"},
					{"TCP 3-Way Handshake & 4-Way Termination"},
					{"UDP vs TCP: use cases (gaming, streaming, DNS)"},
					{"HTTP/1.1 vs HTTP/2 (multiplexing) vs HTTP/3 (QUIC)"},
					{"TLS/HTTPS handshake: certificate chain, symmetric key exchange"},
					{"DNS resolution: recursive vs iterative, TTL, caching"},
					{"WebSockets: upgrade flow, ping/pong, use cases"},
				},
			},
			{
				Title: "Load Balancing & CDN",
				Subtopics: []Subtopic{
					{"Load balancing algorithms: Round Robin, Least Connections, IP Hash"},
					{"L4 vs L7 load balancers"},
					{"CDN: edge caching, cache invalidation, origin pull"},
				},
			},
		},
	},
	{
		Name:     "LLD & System Design",
		Color:    "#06b6d4",
		Position: 6,
		Topics: []Topic{
			{
				Title: "Low-Level Design (LLD)",
				Subtopics: []Subtopic{
					{"SOLID Principles with Go examples"},
					{"Design Patterns: Factory, Strategy, Observer, Decorator"},
					{"Design a Rate Limiter (Token Bucket implementation)"},
					{"Design a Parking Lot System"},
					{"Design an LRU Cache (HashMap + Doubly LinkedList)"},
					{"Design a Notification System"},
				},
			},
			{
				Title: "High-Level Design (HLD)",
				Subtopics: []Subtopic{
					{"Scalability: vertical vs horizontal scaling"},
					{"Availability vs Consistency: CAP Theorem"},
					{"Database Replication: leader-follower, multi-leader"},
					{"Database Sharding: range, hash, directory-based"},
					{"Consistent Hashing: virtual nodes, ring"},
					{"Message Queues in HLD: async decoupling, fan-out"},
					{"Design URL Shortener (TinyURL)"},
					{"Design a Pastebin / File Upload Service"},
				},
			},
		},
	},
	{
		Name:     "Go (Golang)",
		Color:    "#00add8",
		Position: 7,
		Topics: []Topic{
			{
				Title: "Go Fundamentals",
				Subtopics: []Subtopic{
					{"Types, zero values, pointers & value vs reference semantics"},
					{"Structs, methods & interfaces (implicit implementation)"},
					{"Embedding vs inheritance"},
					{"Error handling patterns: errors.Is, errors.As, wrapping"},
					{"Defer, panic & recover"},
				},
			},
			{
				Title: "Concurrency in Go",
				Subtopics: []Subtopic{
					{"Goroutines & the Go scheduler (M:N threading model)"},
					{"Channels: buffered vs unbuffered, direction, select"},
					{"sync.Mutex, sync.RWMutex & sync.WaitGroup"},
					{"Context: cancellation, deadline, value propagation"},
					{"Common patterns: worker pools, fan-out/fan-in, pipeline"},
					{"Race detector: go test -race"},
				},
			},
			{
				Title: "Building REST APIs in Go",
				Subtopics: []Subtopic{
					{"net/http standard library: Handler, ServeMux, middleware"},
					{"Echo framework: routing, groups, middleware, binding"},
					{"Request validation & custom error responses"},
					{"JWT middleware in Go"},
					{"pgx/v5: connection pool, query, scan, transactions"},
					{"Structuring a Go project: cmd/, internal/, pkg/"},
				},
			},
			{
				Title: "Testing in Go",
				Subtopics: []Subtopic{
					{"Table-driven tests with testing.T"},
					{"Mocking with interfaces"},
					{"httptest.NewRecorder for handler testing"},
					{"Benchmarks: testing.B"},
				},
			},
		},
	},
}

func main() {
	email := flag.String("email", "", "Email of the user to seed data for (required)")
	flag.Parse()

	if *email == "" {
		log.Fatal("--email flag is required. Usage: go run ./cmd/seed/main.go --email yash@example.com")
	}

	_ = godotenv.Load(".env")
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	var userID string
	err = pool.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", *email).Scan(&userID)
	if err != nil {
		log.Fatalf("user with email %q not found. Sign up first, then run seed.", *email)
	}
	fmt.Printf("Found user: %s (id: %s)\n", *email, userID)

	for _, cat := range curriculum {
		var catID string
		err = pool.QueryRow(ctx,
			`INSERT INTO categories (user_id, name, color, position)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT DO NOTHING
			 RETURNING id`,
			userID, cat.Name, cat.Color, cat.Position,
		).Scan(&catID)
		if err != nil {
			_ = pool.QueryRow(ctx,
				"SELECT id FROM categories WHERE user_id = $1 AND name = $2",
				userID, cat.Name,
			).Scan(&catID)
		}
		fmt.Printf("  Category: %s (%s)\n", cat.Name, catID)

		for i, topic := range cat.Topics {
			var topicID string
			err = pool.QueryRow(ctx,
				`INSERT INTO topics (user_id, category_id, title, position)
				 VALUES ($1, $2, $3, $4)
				 ON CONFLICT DO NOTHING
				 RETURNING id`,
				userID, catID, topic.Title, i,
			).Scan(&topicID)
			if err != nil {
				_ = pool.QueryRow(ctx,
					"SELECT id FROM topics WHERE user_id = $1 AND category_id = $2 AND title = $3",
					userID, catID, topic.Title,
				).Scan(&topicID)
			}
			fmt.Printf("    Topic: %s (%s)\n", topic.Title, topicID)

			for j, sub := range topic.Subtopics {
				var subID string
				_ = pool.QueryRow(ctx,
					`INSERT INTO topics (user_id, category_id, parent_id, title, position)
					 VALUES ($1, $2, $3, $4, $5)
					 ON CONFLICT DO NOTHING
					 RETURNING id`,
					userID, catID, topicID, sub.Title, j,
				).Scan(&subID)
				fmt.Printf("      Subtopic: %s\n", sub.Title)
			}
		}
	}

	_, _ = pool.Exec(ctx,
		`INSERT INTO user_settings (user_id, weekly_target_hours, reference_sheet_url, goal_type, goal_custom_text, show_reference_sheet)
		 VALUES ($1, 15.0, 'https://neetcode.io/practice/practice/neetcode150', 'sde_backend', NULL, TRUE)
		 ON CONFLICT (user_id) DO NOTHING`,
		userID,
	)

	fmt.Println("\n✅ Seed complete! All categories, topics & subtopics loaded.")
}
