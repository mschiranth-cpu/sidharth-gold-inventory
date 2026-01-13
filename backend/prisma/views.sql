-- ============================================
-- DATABASE VIEWS FOR COMPLEX REPORTS
-- ============================================
-- Run these after migrations to create reporting views
-- These views optimize complex queries used in dashboards and reports

-- ============================================
-- 1. ORDER SUMMARY VIEW
-- Combines order with details and submission status
-- ============================================
CREATE OR REPLACE VIEW v_order_summary AS
SELECT 
    o.id AS order_id,
    o."orderNumber",
    o.status,
    o.priority,
    o."createdAt",
    o."updatedAt",
    o."createdById",
    od."customerName",
    od."productType",
    od.purity,
    od."goldWeight",
    od."dueDate",
    od."estimatedValue",
    fs.id IS NOT NULL AS is_submitted,
    fs."submittedAt",
    fs."finalGoldWeight",
    fs."qualityGrade",
    u.name AS created_by_name,
    u.email AS created_by_email,
    COALESCE(fs."finalGoldWeight", od."goldWeight") AS final_weight,
    CASE 
        WHEN fs.id IS NOT NULL THEN od."goldWeight" - fs."finalGoldWeight"
        ELSE NULL 
    END AS gold_loss
FROM orders o
LEFT JOIN order_details od ON o.id = od."orderId"
LEFT JOIN final_submissions fs ON o.id = fs."orderId"
LEFT JOIN users u ON o."createdById" = u.id;

-- ============================================
-- 2. DEPARTMENT PERFORMANCE VIEW
-- Tracks department efficiency and workload
-- ============================================
CREATE OR REPLACE VIEW v_department_performance AS
SELECT 
    dt."departmentName",
    dt.status,
    COUNT(*) AS total_orders,
    COUNT(CASE WHEN dt.status = 'COMPLETED' THEN 1 END) AS completed,
    COUNT(CASE WHEN dt.status = 'IN_PROGRESS' THEN 1 END) AS in_progress,
    COUNT(CASE WHEN dt.status = 'NOT_STARTED' THEN 1 END) AS pending,
    COUNT(CASE WHEN dt.status = 'ON_HOLD' THEN 1 END) AS on_hold,
    AVG(
        CASE 
            WHEN dt.status = 'COMPLETED' AND dt."startedAt" IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (dt."completedAt" - dt."startedAt")) / 3600 
        END
    ) AS avg_hours_to_complete,
    SUM(dt."goldLoss") AS total_gold_loss,
    AVG(dt."goldLoss") AS avg_gold_loss
FROM department_tracking dt
GROUP BY dt."departmentName", dt.status;

-- ============================================
-- 3. WORKER PRODUCTIVITY VIEW
-- Tracks individual worker performance
-- ============================================
CREATE OR REPLACE VIEW v_worker_productivity AS
SELECT 
    u.id AS user_id,
    u.name,
    u.department,
    u.role,
    COUNT(dt.id) AS total_assignments,
    COUNT(CASE WHEN dt.status = 'COMPLETED' THEN 1 END) AS completed_tasks,
    COUNT(CASE WHEN dt.status = 'IN_PROGRESS' THEN 1 END) AS current_tasks,
    AVG(
        CASE 
            WHEN dt.status = 'COMPLETED' AND dt."startedAt" IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (dt."completedAt" - dt."startedAt")) / 3600 
        END
    ) AS avg_hours_per_task,
    SUM(COALESCE(dt."goldLoss", 0)) AS total_gold_loss,
    MIN(dt."createdAt") AS first_assignment,
    MAX(dt."completedAt") AS last_completed
FROM users u
LEFT JOIN department_tracking dt ON u.id = dt."assignedToId"
WHERE u.role IN ('WORKER', 'DEPARTMENT_HEAD')
GROUP BY u.id, u.name, u.department, u.role;

-- ============================================
-- 4. DAILY ORDER METRICS VIEW
-- Daily aggregations for dashboard charts
-- ============================================
CREATE OR REPLACE VIEW v_daily_order_metrics AS
SELECT 
    DATE_TRUNC('day', o."createdAt") AS date,
    COUNT(*) AS orders_created,
    COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) AS orders_completed,
    SUM(od."goldWeight") AS total_gold_weight,
    SUM(od."estimatedValue") AS total_estimated_value,
    COUNT(CASE WHEN o.priority = 'URGENT' THEN 1 END) AS urgent_orders,
    COUNT(CASE WHEN o.priority = 'HIGH' THEN 1 END) AS high_priority_orders,
    AVG(od."goldWeight") AS avg_gold_weight,
    COUNT(DISTINCT o."createdById") AS unique_creators
FROM orders o
LEFT JOIN order_details od ON o.id = od."orderId"
GROUP BY DATE_TRUNC('day', o."createdAt")
ORDER BY date DESC;

-- ============================================
-- 5. OVERDUE ORDERS VIEW
-- Orders past their due date
-- ============================================
CREATE OR REPLACE VIEW v_overdue_orders AS
SELECT 
    o.id AS order_id,
    o."orderNumber",
    o.status,
    o.priority,
    od."customerName",
    od."productType",
    od."dueDate",
    od."goldWeight",
    o."createdAt",
    EXTRACT(DAY FROM (NOW() - od."dueDate")) AS days_overdue,
    u.name AS created_by,
    u.email AS created_by_email,
    dt_current."departmentName" AS current_department,
    dt_current."assignedToId" AS current_assignee_id
FROM orders o
JOIN order_details od ON o.id = od."orderId"
JOIN users u ON o."createdById" = u.id
LEFT JOIN department_tracking dt_current ON o.id = dt_current."orderId" 
    AND dt_current.status = 'IN_PROGRESS'
WHERE od."dueDate" < NOW()
  AND o.status NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')
ORDER BY days_overdue DESC;

-- ============================================
-- 6. GOLD INVENTORY SUMMARY VIEW
-- Current gold allocation across departments
-- ============================================
CREATE OR REPLACE VIEW v_gold_inventory_summary AS
SELECT 
    'IN_PROGRESS' AS category,
    COALESCE(SUM(od."goldWeight"), 0) AS total_gold_weight,
    COUNT(*) AS order_count
FROM orders o
JOIN order_details od ON o.id = od."orderId"
WHERE o.status = 'IN_PROGRESS'

UNION ALL

SELECT 
    'PENDING' AS category,
    COALESCE(SUM(od."goldWeight"), 0) AS total_gold_weight,
    COUNT(*) AS order_count
FROM orders o
JOIN order_details od ON o.id = od."orderId"
WHERE o.status = 'PENDING'

UNION ALL

SELECT 
    'COMPLETED_UNDELIVERED' AS category,
    COALESCE(SUM(fs."finalGoldWeight"), 0) AS total_gold_weight,
    COUNT(*) AS order_count
FROM orders o
JOIN final_submissions fs ON o.id = fs."orderId"
WHERE o.status = 'COMPLETED';

-- ============================================
-- 7. PURITY DISTRIBUTION VIEW
-- Gold purity breakdown across orders
-- ============================================
CREATE OR REPLACE VIEW v_purity_distribution AS
SELECT 
    od.purity,
    COUNT(*) AS order_count,
    SUM(od."goldWeight") AS total_gold_weight,
    AVG(od."goldWeight") AS avg_gold_weight,
    MIN(od."goldWeight") AS min_gold_weight,
    MAX(od."goldWeight") AS max_gold_weight,
    SUM(od."estimatedValue") AS total_estimated_value
FROM order_details od
JOIN orders o ON od."orderId" = o.id
WHERE o.status != 'CANCELLED'
GROUP BY od.purity
ORDER BY order_count DESC;

-- ============================================
-- 8. QUALITY GRADES DISTRIBUTION VIEW
-- Distribution of quality grades on completed orders
-- ============================================
CREATE OR REPLACE VIEW v_quality_grades_distribution AS
SELECT 
    fs."qualityGrade",
    COUNT(*) AS submission_count,
    SUM(fs."finalGoldWeight") AS total_gold_weight,
    AVG(fs."finalGoldWeight") AS avg_gold_weight,
    COUNT(CASE WHEN fs."customerApproved" THEN 1 END) AS customer_approved_count,
    AVG(EXTRACT(DAY FROM (fs."submittedAt" - o."createdAt"))) AS avg_days_to_complete
FROM final_submissions fs
JOIN orders o ON fs."orderId" = o.id
GROUP BY fs."qualityGrade"
ORDER BY submission_count DESC;

-- ============================================
-- INDEXES ON MATERIALIZED VIEWS (if using materialized views)
-- ============================================
-- Uncomment below if you convert views to materialized views for better performance

-- CREATE UNIQUE INDEX idx_mv_order_summary_id ON v_order_summary (order_id);
-- CREATE INDEX idx_mv_order_summary_status ON v_order_summary (status);
-- CREATE INDEX idx_mv_order_summary_date ON v_order_summary ("createdAt");

-- CREATE UNIQUE INDEX idx_mv_daily_metrics_date ON v_daily_order_metrics (date);

-- ============================================
-- REFRESH MATERIALIZED VIEWS (scheduled job)
-- ============================================
-- If using materialized views, refresh them periodically:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_order_summary;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_daily_order_metrics;
