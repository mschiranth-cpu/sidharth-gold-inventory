--
-- PostgreSQL database dump
--

\restrict Ji0y46ZKkHSXakZoXOGqFLHH2odZHlgLRDFKXXIRw55zkc8vMG2LAq6YHf9hZsN

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DepartmentName; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DepartmentName" AS ENUM (
    'CAD',
    'PRINT',
    'CASTING',
    'FILLING',
    'MEENA',
    'POLISH_1',
    'SETTING',
    'POLISH_2',
    'ADDITIONAL'
);


ALTER TYPE public."DepartmentName" OWNER TO postgres;

--
-- Name: DepartmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DepartmentStatus" AS ENUM (
    'PENDING_ASSIGNMENT',
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'ON_HOLD'
);


ALTER TYPE public."DepartmentStatus" OWNER TO postgres;

--
-- Name: DiamondClarity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DiamondClarity" AS ENUM (
    'FL',
    'IF',
    'VVS1',
    'VVS2',
    'VS1',
    'VS2',
    'SI1',
    'SI2',
    'I1',
    'I2',
    'I3'
);


ALTER TYPE public."DiamondClarity" OWNER TO postgres;

--
-- Name: DiamondColor; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DiamondColor" AS ENUM (
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N_Z',
    'FANCY'
);


ALTER TYPE public."DiamondColor" OWNER TO postgres;

--
-- Name: DiamondCut; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DiamondCut" AS ENUM (
    'EXCELLENT',
    'VERY_GOOD',
    'GOOD',
    'FAIR',
    'POOR'
);


ALTER TYPE public."DiamondCut" OWNER TO postgres;

--
-- Name: DiamondShape; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DiamondShape" AS ENUM (
    'ROUND',
    'PRINCESS',
    'OVAL',
    'MARQUISE',
    'PEAR',
    'CUSHION',
    'EMERALD',
    'ASSCHER',
    'RADIANT',
    'HEART',
    'OTHER'
);


ALTER TYPE public."DiamondShape" OWNER TO postgres;

--
-- Name: MetalForm; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MetalForm" AS ENUM (
    'BAR',
    'WIRE',
    'SHEET',
    'GRAIN',
    'SCRAP',
    'FINISHED_PIECE',
    'CUSTOMER_METAL'
);


ALTER TYPE public."MetalForm" OWNER TO postgres;

--
-- Name: MetalTransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MetalTransactionType" AS ENUM (
    'PURCHASE',
    'SALE',
    'ISSUE_TO_DEPARTMENT',
    'RETURN_FROM_DEPARTMENT',
    'MELTING_IN',
    'MELTING_OUT',
    'WASTAGE',
    'ADJUSTMENT',
    'CUSTOMER_METAL_IN',
    'CUSTOMER_METAL_OUT'
);


ALTER TYPE public."MetalTransactionType" OWNER TO postgres;

--
-- Name: MetalType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MetalType" AS ENUM (
    'GOLD',
    'SILVER',
    'PLATINUM',
    'PALLADIUM'
);


ALTER TYPE public."MetalType" OWNER TO postgres;

--
-- Name: NotificationPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationPriority" AS ENUM (
    'CRITICAL',
    'IMPORTANT',
    'INFO',
    'SUCCESS'
);


ALTER TYPE public."NotificationPriority" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'NEW_ASSIGNMENT',
    'WORK_APPROVED',
    'WORK_REJECTED',
    'URGENT_ASSIGNMENT',
    'ORDER_CANCELLED',
    'COMMENT_ADDED',
    'NEW_ORDER_CREATED',
    'ORDER_COMPLETED',
    'WORK_SUBMITTED',
    'QUALITY_ISSUE',
    'ORDER_DELAYED',
    'DEPARTMENT_BLOCKED',
    'WORKER_IDLE',
    'PAYMENT_RECEIVED',
    'DAILY_SUMMARY',
    'CUSTOMER_INQUIRY',
    'ORDER_READY',
    'DUE_DATE_APPROACHING',
    'PAYMENT_PENDING',
    'DELIVERY_SCHEDULED',
    'DEPARTMENT_OVERLOAD',
    'EQUIPMENT_ISSUE',
    'WORKFLOW_CHANGE'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'DRAFT',
    'IN_FACTORY',
    'COMPLETED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: RealStoneType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RealStoneType" AS ENUM (
    'RUBY',
    'EMERALD',
    'BLUE_SAPPHIRE',
    'YELLOW_SAPPHIRE',
    'PINK_SAPPHIRE',
    'ALEXANDRITE',
    'TANZANITE',
    'TOURMALINE',
    'SPINEL',
    'GARNET',
    'AQUAMARINE',
    'TOPAZ',
    'OPAL',
    'PEARL',
    'CORAL',
    'OTHER'
);


ALTER TYPE public."RealStoneType" OWNER TO postgres;

--
-- Name: StoneType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StoneType" AS ENUM (
    'DIAMOND',
    'RUBY',
    'EMERALD',
    'SAPPHIRE',
    'PEARL',
    'KUNDAN',
    'POLKI',
    'CZ',
    'AMERICAN_DIAMOND',
    'SEMI_PRECIOUS',
    'OTHER'
);


ALTER TYPE public."StoneType" OWNER TO postgres;

--
-- Name: SyntheticStoneType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SyntheticStoneType" AS ENUM (
    'CZ',
    'AMERICAN_DIAMOND',
    'KUNDAN',
    'POLKI',
    'MOISSANITE',
    'GLASS',
    'SYNTHETIC_RUBY',
    'SYNTHETIC_EMERALD',
    'SYNTHETIC_SAPPHIRE',
    'MARCASITE',
    'OTHER'
);


ALTER TYPE public."SyntheticStoneType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'OFFICE_STAFF',
    'FACTORY_MANAGER',
    'DEPARTMENT_WORKER',
    'CLIENT'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id text NOT NULL,
    user_id text NOT NULL,
    date date NOT NULL,
    check_in_time timestamp(3) without time zone,
    check_in_photo text,
    check_in_lat double precision,
    check_in_lng double precision,
    check_in_device text,
    check_out_time timestamp(3) without time zone,
    check_out_photo text,
    check_out_lat double precision,
    check_out_lng double precision,
    check_out_device text,
    total_hours double precision,
    overtime_hours double precision,
    status text DEFAULT 'ABSENT'::text NOT NULL,
    is_late boolean DEFAULT false NOT NULL,
    late_minutes integer,
    is_early_out boolean DEFAULT false NOT NULL,
    early_minutes integer,
    approved_by_id text,
    approved_at timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    action text NOT NULL,
    "userId" text NOT NULL,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id text NOT NULL,
    user_id text NOT NULL,
    business_name text,
    business_type text,
    gst_number text,
    pan_number text,
    contact_person text,
    phone text,
    alternate_phone text,
    address text,
    city text,
    state text,
    pincode text,
    registration_method text DEFAULT 'ADMIN_CREATED'::text NOT NULL,
    approval_status text DEFAULT 'PENDING'::text NOT NULL,
    approved_by_id text,
    approved_at timestamp(3) without time zone,
    rejection_reason text,
    notify_by_email boolean DEFAULT true NOT NULL,
    notify_by_sms boolean DEFAULT false NOT NULL,
    notify_by_whatsapp boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: department_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_tracking (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "departmentName" public."DepartmentName" NOT NULL,
    "sequenceOrder" integer NOT NULL,
    status public."DepartmentStatus" DEFAULT 'NOT_STARTED'::public."DepartmentStatus" NOT NULL,
    "assignedToId" text,
    "queuePosition" integer,
    "queuedAt" timestamp(3) without time zone,
    "goldWeightIn" double precision,
    "goldWeightOut" double precision,
    "goldLoss" double precision,
    "estimatedHours" double precision,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    notes text,
    photos text[],
    issues text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.department_tracking OWNER TO postgres;

--
-- Name: department_work_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_work_data (
    id text NOT NULL,
    "departmentTrackingId" text NOT NULL,
    "formData" jsonb,
    "uploadedFiles" jsonb,
    "uploadedPhotos" jsonb,
    "workStartedAt" timestamp(3) without time zone,
    "workCompletedAt" timestamp(3) without time zone,
    "timeSpent" double precision,
    "isComplete" boolean DEFAULT false NOT NULL,
    "isDraft" boolean DEFAULT true NOT NULL,
    "validationErrors" jsonb,
    "lastSavedAt" timestamp(3) without time zone,
    "autoSaveData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.department_work_data OWNER TO postgres;

--
-- Name: diamond_lots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diamond_lots (
    id text NOT NULL,
    lot_number text NOT NULL,
    description text,
    total_pieces integer NOT NULL,
    total_carats double precision NOT NULL,
    avg_price_per_carat double precision,
    supplier_id text,
    purchase_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.diamond_lots OWNER TO postgres;

--
-- Name: diamond_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diamond_payments (
    id text NOT NULL,
    transaction_id text NOT NULL,
    amount double precision NOT NULL,
    payment_mode text NOT NULL,
    cash_amount double precision,
    neft_amount double precision,
    neft_utr text,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    credit_applied double precision,
    credit_generated double precision,
    notes text,
    recorded_by_id text NOT NULL,
    recorded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.diamond_payments OWNER TO postgres;

--
-- Name: diamond_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diamond_rates (
    id text NOT NULL,
    shape public."DiamondShape" NOT NULL,
    color public."DiamondColor" NOT NULL,
    clarity public."DiamondClarity" NOT NULL,
    carat_from double precision NOT NULL,
    carat_to double precision NOT NULL,
    price_per_carat double precision NOT NULL,
    effective_date timestamp(3) without time zone NOT NULL,
    source text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.diamond_rates OWNER TO postgres;

--
-- Name: diamond_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diamond_transactions (
    id text NOT NULL,
    diamond_id text NOT NULL,
    transaction_type text NOT NULL,
    from_location text,
    to_location text,
    order_id text,
    worker_id text,
    notes text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    department_id text,
    vendor_id text,
    reference_number text,
    carat_weight double precision,
    price_per_carat double precision,
    total_value double precision,
    quantity_pieces integer,
    is_billable boolean,
    payment_mode text,
    payment_status text,
    amount_paid double precision,
    cash_amount double precision,
    neft_amount double precision,
    neft_utr text,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    credit_applied double precision,
    credit_generated double precision
);


ALTER TABLE public.diamond_transactions OWNER TO postgres;

--
-- Name: diamonds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diamonds (
    id text NOT NULL,
    stock_number text NOT NULL,
    carat_weight double precision NOT NULL,
    color public."DiamondColor" NOT NULL,
    clarity public."DiamondClarity" NOT NULL,
    cut public."DiamondCut",
    shape public."DiamondShape" NOT NULL,
    measurements text,
    depth_percent double precision,
    table_percent double precision,
    polish text,
    symmetry text,
    fluorescence text,
    certification_lab text,
    cert_number text,
    cert_date timestamp(3) without time zone,
    cert_url text,
    price_per_carat double precision,
    total_price double precision,
    lot_id text,
    status text DEFAULT 'IN_STOCK'::text NOT NULL,
    current_location text,
    issued_to_order_id text,
    issued_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    category text DEFAULT 'SOLITAIRE'::character varying NOT NULL,
    color_band text,
    total_pieces integer
);


ALTER TABLE public.diamonds OWNER TO postgres;

--
-- Name: employee_advances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_advances (
    id text NOT NULL,
    user_id text NOT NULL,
    amount double precision NOT NULL,
    reason text,
    given_date timestamp(3) without time zone NOT NULL,
    deduction_per_month double precision NOT NULL,
    total_deducted double precision DEFAULT 0 NOT NULL,
    remaining_amount double precision NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    approved_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employee_advances OWNER TO postgres;

--
-- Name: employee_loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_loans (
    id text NOT NULL,
    user_id text NOT NULL,
    loan_amount double precision NOT NULL,
    interest_rate double precision,
    tenure integer NOT NULL,
    emi_amount double precision NOT NULL,
    disbursed_date timestamp(3) without time zone NOT NULL,
    start_month timestamp(3) without time zone NOT NULL,
    total_paid double precision DEFAULT 0 NOT NULL,
    remaining_amount double precision NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    approved_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employee_loans OWNER TO postgres;

--
-- Name: employee_shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_shifts (
    id text NOT NULL,
    user_id text NOT NULL,
    shift_id text NOT NULL,
    effective_from timestamp(3) without time zone NOT NULL,
    effective_to timestamp(3) without time zone
);


ALTER TABLE public.employee_shifts OWNER TO postgres;

--
-- Name: equipment_maintenance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_maintenance (
    id text NOT NULL,
    equipment_id text NOT NULL,
    maintenance_type text NOT NULL,
    description text NOT NULL,
    cost double precision,
    performed_by text,
    performed_at timestamp(3) without time zone NOT NULL,
    next_due_date timestamp(3) without time zone,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.equipment_maintenance OWNER TO postgres;

--
-- Name: factory_item_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factory_item_categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    parent_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.factory_item_categories OWNER TO postgres;

--
-- Name: factory_item_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factory_item_transactions (
    id text NOT NULL,
    item_id text NOT NULL,
    transaction_type text NOT NULL,
    quantity double precision NOT NULL,
    rate double precision,
    total_value double precision,
    department_id text,
    worker_id text,
    vendor_id text,
    reference_number text,
    notes text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.factory_item_transactions OWNER TO postgres;

--
-- Name: factory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factory_items (
    id text NOT NULL,
    item_code text NOT NULL,
    name text NOT NULL,
    description text,
    category_id text NOT NULL,
    unit text NOT NULL,
    current_stock double precision DEFAULT 0 NOT NULL,
    min_stock double precision,
    max_stock double precision,
    reorder_qty double precision,
    last_purchase_price double precision,
    avg_price double precision,
    location text,
    is_equipment boolean DEFAULT false NOT NULL,
    serial_number text,
    purchase_date timestamp(3) without time zone,
    warranty_end timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.factory_items OWNER TO postgres;

--
-- Name: feature_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_modules (
    id text NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    icon text,
    is_global boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.feature_modules OWNER TO postgres;

--
-- Name: feature_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_permissions (
    id text NOT NULL,
    feature_id text NOT NULL,
    user_id text,
    role public."UserRole",
    department_id text,
    is_enabled boolean DEFAULT false NOT NULL,
    can_read boolean DEFAULT true NOT NULL,
    can_write boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    enabled_by_id text,
    enabled_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.feature_permissions OWNER TO postgres;

--
-- Name: final_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.final_submissions (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "finalGoldWeight" double precision NOT NULL,
    "finalStoneWeight" double precision NOT NULL,
    "finalPurity" double precision NOT NULL,
    "numberOfPieces" integer DEFAULT 1 NOT NULL,
    "totalWeight" double precision,
    "qualityGrade" text,
    "qualityNotes" text,
    "completionPhotos" text[],
    "certificateUrl" text,
    "submittedById" text NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "customerApproved" boolean DEFAULT false NOT NULL,
    "approvalDate" timestamp(3) without time zone,
    "approvalNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.final_submissions OWNER TO postgres;

--
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id text NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    is_optional boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- Name: leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaves (
    id text NOT NULL,
    user_id text NOT NULL,
    leave_type text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days double precision NOT NULL,
    reason text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    approved_by_id text,
    approved_at timestamp(3) without time zone,
    rejection_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.leaves OWNER TO postgres;

--
-- Name: melting_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.melting_batches (
    id text NOT NULL,
    batch_number text NOT NULL,
    input_metals jsonb NOT NULL,
    total_input_weight double precision NOT NULL,
    output_purity double precision NOT NULL,
    output_weight double precision NOT NULL,
    output_form public."MetalForm" NOT NULL,
    wastage_weight double precision NOT NULL,
    wastage_percent double precision NOT NULL,
    melted_by_id text NOT NULL,
    melted_at timestamp(3) without time zone NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.melting_batches OWNER TO postgres;

--
-- Name: metal_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metal_payments (
    id text NOT NULL,
    transaction_id text NOT NULL,
    amount double precision NOT NULL,
    payment_mode text NOT NULL,
    cash_amount double precision,
    neft_amount double precision,
    neft_utr text,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    credit_applied double precision,
    credit_generated double precision,
    notes text,
    recorded_by_id text NOT NULL,
    recorded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.metal_payments OWNER TO postgres;

--
-- Name: metal_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metal_rates (
    id text NOT NULL,
    metal_type public."MetalType" NOT NULL,
    purity double precision NOT NULL,
    rate_per_gram double precision NOT NULL,
    effective_date timestamp(3) without time zone NOT NULL,
    source text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.metal_rates OWNER TO postgres;

--
-- Name: metal_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metal_stock (
    id text NOT NULL,
    metal_type public."MetalType" NOT NULL,
    purity double precision NOT NULL,
    form public."MetalForm" NOT NULL,
    gross_weight double precision DEFAULT 0 NOT NULL,
    pure_weight double precision DEFAULT 0 NOT NULL,
    location text,
    batch_number text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.metal_stock OWNER TO postgres;

--
-- Name: metal_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metal_transactions (
    id text NOT NULL,
    transaction_type public."MetalTransactionType" NOT NULL,
    metal_type public."MetalType" NOT NULL,
    purity double precision NOT NULL,
    form public."MetalForm" NOT NULL,
    gross_weight double precision NOT NULL,
    pure_weight double precision NOT NULL,
    rate double precision,
    total_value double precision,
    stock_id text,
    order_id text,
    department_id text,
    worker_id text,
    melting_batch_id text,
    notes text,
    reference_number text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    vendor_id text,
    amount_paid double precision,
    cash_amount double precision,
    credit_applied double precision,
    credit_generated double precision,
    is_billable boolean,
    neft_amount double precision,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    neft_utr text,
    payment_mode text,
    payment_status text
);


ALTER TABLE public.metal_transactions OWNER TO postgres;

--
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_queue (
    id text NOT NULL,
    recipient_id text NOT NULL,
    recipient_type text NOT NULL,
    channel text NOT NULL,
    subject text,
    message text NOT NULL,
    template_id text,
    template_data jsonb,
    status text DEFAULT 'PENDING'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp(3) without time zone,
    sent_at timestamp(3) without time zone,
    error_message text,
    order_id text,
    scheduled_for timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification_queue OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    priority public."NotificationPriority" DEFAULT 'INFO'::public."NotificationPriority" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "orderId" text,
    "actionUrl" text,
    "actionLabel" text,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    metadata jsonb
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: order_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_activities (
    id text NOT NULL,
    "orderId" text NOT NULL,
    action text NOT NULL,
    title text NOT NULL,
    description text,
    "userId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_activities OWNER TO postgres;

--
-- Name: order_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_comments (
    id text NOT NULL,
    order_id text NOT NULL,
    user_id text NOT NULL,
    message text NOT NULL,
    attachments text[],
    is_internal boolean DEFAULT false NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_comments OWNER TO postgres;

--
-- Name: order_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_details (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "goldWeightInitial" double precision,
    purity double precision NOT NULL,
    "goldColor" text,
    "metalType" text DEFAULT 'GOLD'::text,
    "metalFinish" text,
    "customFinish" text,
    size text,
    quantity integer DEFAULT 1 NOT NULL,
    "productType" text,
    "customProductType" text,
    "productSpecifications" jsonb,
    "cadFiles" text[],
    "hallmarkRequired" boolean DEFAULT true NOT NULL,
    "huidNumber" text,
    "bisHallmark" text,
    "makingChargeType" text,
    "makingChargeValue" double precision,
    "wastagePercentage" double precision,
    "laborCharges" double precision,
    "meltingInstructions" text,
    "claspType" text,
    "engravingText" text,
    "polishType" text,
    "rhodiumPlating" boolean DEFAULT false NOT NULL,
    "certificationRequired" text,
    "usingCustomerGold" boolean DEFAULT false NOT NULL,
    "customerGoldWeight" double precision,
    "customerGoldPurity" double precision,
    "deliveryMethod" text,
    "customerAddress" text,
    occasion text,
    "designCategory" text,
    "warrantyPeriod" text,
    "exchangeAllowed" boolean DEFAULT false NOT NULL,
    "paymentTerms" text,
    "advancePercentage" double precision,
    "goldRateLocked" boolean DEFAULT false NOT NULL,
    "expectedGoldRate" double precision,
    "estimatedGoldCost" double precision,
    "estimatedStoneCost" double precision,
    "estimatedMakingCharges" double precision,
    "estimatedOtherCharges" double precision,
    "estimatedTotalCost" double precision,
    "templateName" text,
    "clonedFromOrderId" text,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "additionalDescription" text,
    "specialInstructions" text,
    "referenceImages" text[],
    "enteredById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_details OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "customerName" text NOT NULL,
    "customerPhone" text,
    "customerEmail" text,
    "productPhotoUrl" text,
    status public."OrderStatus" DEFAULT 'DRAFT'::public."OrderStatus" NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "currentDepartment" public."DepartmentName",
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "clientId" text,
    "orderSource" text DEFAULT 'INTERNAL'::text NOT NULL,
    "approvalStatus" text,
    "approvedById" text,
    "approvedAt" timestamp(3) without time zone,
    "rejectionReason" text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_periods (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    working_days integer NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    processed_by_id text,
    processed_at timestamp(3) without time zone,
    finalized_by_id text,
    finalized_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payroll_periods OWNER TO postgres;

--
-- Name: payslips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payslips (
    id text NOT NULL,
    period_id text NOT NULL,
    user_id text NOT NULL,
    total_days integer NOT NULL,
    present_days double precision NOT NULL,
    absent_days double precision NOT NULL,
    leave_days double precision NOT NULL,
    holidays integer NOT NULL,
    overtime_hours double precision NOT NULL,
    late_deductions double precision,
    basic_earned double precision NOT NULL,
    hra_earned double precision,
    da_earned double precision,
    conveyance_earned double precision,
    medical_earned double precision,
    special_earned double precision,
    other_earned double precision,
    overtime_pay double precision,
    bonus double precision,
    incentive double precision,
    gross_earnings double precision NOT NULL,
    advance_deduction double precision,
    loan_deduction double precision,
    other_deduction double precision,
    total_deductions double precision NOT NULL,
    net_salary double precision NOT NULL,
    payment_status text DEFAULT 'PENDING'::text NOT NULL,
    payment_date timestamp(3) without time zone,
    payment_mode text,
    transaction_ref text,
    payslip_url text,
    emailed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payslips OWNER TO postgres;

--
-- Name: real_stone_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.real_stone_payments (
    id text NOT NULL,
    transaction_id text NOT NULL,
    amount double precision NOT NULL,
    payment_mode text NOT NULL,
    cash_amount double precision,
    neft_amount double precision,
    neft_utr text,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    credit_applied double precision,
    credit_generated double precision,
    notes text,
    recorded_by_id text NOT NULL,
    recorded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.real_stone_payments OWNER TO postgres;

--
-- Name: real_stone_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.real_stone_rates (
    id text NOT NULL,
    stone_type public."RealStoneType" NOT NULL,
    quality text,
    carat_from double precision NOT NULL,
    carat_to double precision NOT NULL,
    price_per_carat double precision NOT NULL,
    effective_date timestamp(3) without time zone NOT NULL,
    source text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.real_stone_rates OWNER TO postgres;

--
-- Name: real_stone_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.real_stone_transactions (
    id text NOT NULL,
    stone_id text NOT NULL,
    transaction_type text NOT NULL,
    order_id text,
    notes text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    amount_paid double precision,
    carat_weight double precision,
    cash_amount double precision,
    credit_applied double precision,
    credit_generated double precision,
    department_id text,
    from_location text,
    is_billable boolean,
    neft_amount double precision,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    neft_utr text,
    payment_mode text,
    payment_status text,
    price_per_carat double precision,
    reference_number text,
    to_location text,
    total_value double precision,
    updated_at timestamp(3) without time zone NOT NULL,
    vendor_id text,
    worker_id text
);


ALTER TABLE public.real_stone_transactions OWNER TO postgres;

--
-- Name: real_stones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.real_stones (
    id text NOT NULL,
    stock_number text NOT NULL,
    stone_type public."RealStoneType" NOT NULL,
    carat_weight double precision NOT NULL,
    shape text NOT NULL,
    color text NOT NULL,
    clarity text,
    cut text,
    origin text,
    treatment text,
    treatment_notes text,
    cert_lab text,
    cert_number text,
    cert_date timestamp(3) without time zone,
    price_per_carat double precision,
    total_price double precision,
    status text DEFAULT 'IN_STOCK'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.real_stones OWNER TO postgres;

--
-- Name: salary_structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_structures (
    id text NOT NULL,
    user_id text NOT NULL,
    basic_salary double precision NOT NULL,
    hra double precision,
    da double precision,
    conveyance double precision,
    medical_allow double precision,
    special_allow double precision,
    other_allow double precision,
    per_day_rate double precision,
    per_hour_rate double precision,
    overtime_rate double precision,
    bank_name text,
    account_number text,
    ifsc_code text,
    effective_from timestamp(3) without time zone NOT NULL,
    effective_to timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.salary_structures OWNER TO postgres;

--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id text NOT NULL,
    name text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    break_minutes integer DEFAULT 60 NOT NULL,
    grace_minutes integer DEFAULT 15 NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: specification_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specification_templates (
    id text NOT NULL,
    name text NOT NULL,
    "productType" text NOT NULL,
    specifications jsonb NOT NULL,
    "userId" text NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.specification_templates OWNER TO postgres;

--
-- Name: stone_packet_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stone_packet_payments (
    id text NOT NULL,
    transaction_id text NOT NULL,
    amount double precision NOT NULL,
    payment_mode text NOT NULL,
    cash_amount double precision,
    neft_amount double precision,
    neft_utr text,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    credit_applied double precision,
    credit_generated double precision,
    notes text,
    recorded_by_id text NOT NULL,
    recorded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stone_packet_payments OWNER TO postgres;

--
-- Name: stone_packet_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stone_packet_transactions (
    id text NOT NULL,
    packet_id text NOT NULL,
    transaction_type text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    order_id text,
    worker_id text,
    notes text,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    amount_paid double precision,
    cash_amount double precision,
    credit_applied double precision,
    credit_generated double precision,
    department_id text,
    from_location text,
    is_billable boolean,
    neft_amount double precision,
    neft_bank text,
    neft_date timestamp(3) without time zone,
    neft_utr text,
    payment_mode text,
    payment_status text,
    price_per_unit double precision,
    reference_number text,
    to_location text,
    total_value double precision,
    updated_at timestamp(3) without time zone NOT NULL,
    vendor_id text
);


ALTER TABLE public.stone_packet_transactions OWNER TO postgres;

--
-- Name: stone_packets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stone_packets (
    id text NOT NULL,
    packet_number text NOT NULL,
    stone_type public."SyntheticStoneType" NOT NULL,
    shape text NOT NULL,
    size text NOT NULL,
    color text NOT NULL,
    quality text,
    total_pieces integer,
    total_weight double precision NOT NULL,
    unit text DEFAULT 'CARAT'::text NOT NULL,
    current_pieces integer,
    current_weight double precision NOT NULL,
    price_per_unit double precision,
    reorder_level double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.stone_packets OWNER TO postgres;

--
-- Name: stones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stones (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "stoneType" public."StoneType" NOT NULL,
    "stoneName" text,
    "customType" text,
    weight double precision NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    color text,
    clarity text,
    cut text,
    shape text,
    "customShape" text,
    setting text,
    "customSetting" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.stones OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'DEPARTMENT_WORKER'::public."UserRole" NOT NULL,
    department public."DepartmentName",
    phone text,
    avatar text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "availabilityStatus" text DEFAULT 'AVAILABLE'::text NOT NULL,
    "lastAssignedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id text NOT NULL,
    name text NOT NULL,
    unique_code text NOT NULL,
    phone text,
    gst_number text,
    gst_details jsonb,
    address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    credit_balance double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
55315eb3-f226-4ad5-8ef9-afcd527d9610	83c9927338dbc3a0fd02d5f7254998c732dce01df8e63fb408462747de93734a	2026-04-22 21:31:28.809522+05:30	20260110061647_update_owner_info		\N	2026-04-22 21:31:28.809522+05:30	0
fa9145a0-6c8f-420a-a416-f50e0ad56c30	198cc4bca9ce174941f30bc1ee8c3241430dbfffd28f694e43b91c294b9a5fff	2026-04-22 21:31:29.417172+05:30	20260110074812_add_order_completion_fields		\N	2026-04-22 21:31:29.417172+05:30	0
9e299c74-80d6-4525-855d-194b546b3e09	22ec1e960ebe0338f40026f524bf46db8c478191924c8e00ffa556cb8f0adc1a	2026-04-22 21:31:30.040142+05:30	20260110124722_add_metal_finish_fields		\N	2026-04-22 21:31:30.040142+05:30	0
d27759b8-6496-4af1-9c4d-cdbfa97821c1	a5b44f15b2fdedf9d4390a55e148b74462b4e30cac72c7138370144c7e69a6b0	2026-04-22 21:31:30.651464+05:30	20260110131128_add_manufacturing_and_pricing_details		\N	2026-04-22 21:31:30.651464+05:30	0
42c50762-0f33-47ce-83cd-af7f23f9471b	d02c738a10fe5c6d1a27b639dae1098ce6503b8d4fad14d9186de63995c58fbb	2026-04-22 21:31:31.266108+05:30	20260110131751_add_logistics_classification_features		\N	2026-04-22 21:31:31.266108+05:30	0
550986b2-0c7d-4076-a539-be52eaf11e04	50d8a18b9296dfe1d6ba7290caea257783b0bab71e5d42ba419c6e0e076ce7f9	2026-04-22 21:31:31.893662+05:30	20260110132441_add_price_estimation_and_template_features		\N	2026-04-22 21:31:31.893662+05:30	0
4653c257-8ec2-4264-b279-81a34c325c74	96aecb42f2e7bc276e88712c17e2bfbc4bc4af57370a5fbeae90df64aeded354	2026-04-22 21:31:32.5069+05:30	20260110140926_make_gold_weight_optional		\N	2026-04-22 21:31:32.5069+05:30	0
525d8e17-11b8-4514-af81-f6da9a0b5b35	320bca5943a9f348b12ba7f70ab91b19026217b6710f5ba349595843318f185c	2026-04-22 21:31:33.116326+05:30	20260110141446_add_custom_product_type		\N	2026-04-22 21:31:33.116326+05:30	0
b3835441-50da-48aa-92be-0d7a09fe7e93	003a8cdbe497975c1d5c71c3494adf74522172b8ec82db625d50fc73fe331628	2026-04-22 21:31:33.731678+05:30	20260110143309_add_custom_stone_fields		\N	2026-04-22 21:31:33.731678+05:30	0
17e397ad-c349-4b08-86c3-b3fefd6acac2	05338a52610e3354fe24d2b84088b418f5a87f73f0069e7a0d80bde6231753d8	2026-04-22 21:31:34.338593+05:30	20260110192654_add_assignment_fields		\N	2026-04-22 21:31:34.338593+05:30	0
befc2d6a-9686-42a0-b5ef-c8066e2cc646	a714a8c3b26e331ac4e9438d52fb1cdf7c8c0ca5205f5a664e8ba01fe0f8f64f	2026-04-22 21:31:34.96627+05:30	20260111041344_add_order_activity_tracking		\N	2026-04-22 21:31:34.96627+05:30	0
7722d0ef-774d-4970-8555-f51c6f45cd22	f5cadb02a964fda2583554f4efa18b391577f8f843475b962fd80b3a47d9d8ac	2026-04-22 21:31:35.583827+05:30	20260111080031_add_department_work_data		\N	2026-04-22 21:31:35.583827+05:30	0
2cd3d731-5b5e-43a8-ac45-342cffda90bc	523da7d9da712e9c647b8cf9e30de14a0937eaee21275dc898ad13c80070286e	2026-04-22 21:31:36.200649+05:30	20260112060114_add_pending_assignment_status		\N	2026-04-22 21:31:36.200649+05:30	0
2f358ba9-3c58-4409-8f30-454d846e8b5e	2a82901759c53eed1878b0081648c20539625b50c5c20c0433a19afe1136c25d	2026-04-22 21:31:36.832394+05:30	20260112111545_add_notification_system		\N	2026-04-22 21:31:36.832394+05:30	0
ba2e7d3b-eef3-4999-a369-ec8d73f1cd4e	244414dc6f072a1be544fa4767534a3901819260a7e0e00c331c12b96c4cd77e	2026-04-22 21:31:37.479821+05:30	20260113144904_add_product_specifications		\N	2026-04-22 21:31:37.479821+05:30	0
c2722c75-4538-4cb2-af83-b4f3da4d140b	79f8794088c64a027a5e8fbc7c6a23c950031d75e865c11bc0fec16fb28347da	2026-04-22 21:31:38.094662+05:30	20260114132049_add_stone_inventory		\N	2026-04-22 21:31:38.094662+05:30	0
a261e89d-c9d4-43e7-91bb-764313aa5aac	9ec0b7b21d86256754f480069ea60d1e5162212adb765c3d12489bec2d5cb199	2026-04-22 21:31:38.71793+05:30	20260114_add_attendance_payroll		\N	2026-04-22 21:31:38.71793+05:30	0
3f7b8cde-7b65-4b4c-b30b-624f642865bc	12816a06dc2de9b7b4ad3309c4072e3678894dd7670b2fedce42480668367757	2026-04-22 21:31:39.336639+05:30	20260114_add_factory_inventory		\N	2026-04-22 21:31:39.336639+05:30	0
21380182-55cd-4e0e-bf9f-dc868e104b25	58d1c584bb8b39b2bec6214c383b98bac71ff911005d7dfe36e5836cf5a00958	2026-04-22 21:31:39.950821+05:30	20260114_add_feature_toggle_and_client_portal		\N	2026-04-22 21:31:39.950821+05:30	0
236d9895-3231-473a-bee8-45f2e539d944	c01049ce8e71e581634d52f023a6d06a1ec37b193f5915e07896be7e3e08edd9	2026-04-22 21:31:40.558881+05:30	20260114_add_metal_inventory		\N	2026-04-22 21:31:40.558881+05:30	0
b225a74c-3816-410d-b029-6de9e4196484	6df5a7ea40f006304b307b492659b0b394bfbcaec30091eadba1bf9add145bad	2026-04-22 21:31:41.176827+05:30	20260114_add_specification_templates		\N	2026-04-22 21:31:41.176827+05:30	0
d696b187-3f64-42c5-b7ed-2935a02ec047	8ef412717fddf0ad1edfd8f38e9fd63b499e3d32d2c871ae757cc4f8be6c7ce0	2026-04-22 21:31:41.889648+05:30	20260114_add_stone_inventory		\N	2026-04-22 21:31:41.889648+05:30	0
328c6c46-1b39-4665-a0b1-61e2aaf71b17	0c3ceaf8854ff84859bb36dca8779639ff6bb09ff22370b36b1d44b814029f7d	\N	20260428180000_stone_inventory_parity	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260428180000_stone_inventory_parity\n\nDatabase error code: 42601\n\nDatabase error:\nERROR: syntax error at or near "﻿"\n\nPosition:\n[1m  0[0m\n[1m  1[1;31m ﻿-- AlterTable[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42601), message: "syntax error at or near \\"\\u{feff}\\"", detail: None, hint: None, position: Some(Original(1)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("scan.l"), line: Some(1248), routine: Some("scanner_yyerror") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260428180000_stone_inventory_parity"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260428180000_stone_inventory_parity"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2026-04-28 18:17:53.337126+05:30	2026-04-28 18:17:27.932328+05:30	0
dd2829e0-f685-4967-b6c7-5dc5b94a4242	850da88158757360961b722afaed13549860b99f5f8684dc7de041145ed191a2	2026-04-26 14:09:19.470332+05:30	20260426000000_drop_party_metal	\N	\N	2026-04-26 14:09:19.457547+05:30	1
a5e987c6-68e9-492f-8921-e7fbfee4694d	7bf90b7634a8970be79090fa7919374d24d2e6dd54bcf863892c9426fb03eb98	2026-04-28 12:06:06.882488+05:30	20260428000000_add_diamond_category	\N	\N	2026-04-28 12:06:06.860438+05:30	1
39325679-f968-4e32-a123-c6bfc63bcdd8	eb26c45586c87adaafe003cdf8bde114063e9c713a2de225b8019d3e56c126e7	2026-04-28 12:06:06.910544+05:30	20260428100000_diamond_full_parity	\N	\N	2026-04-28 12:06:06.882841+05:30	1
8835f1e6-ed12-4ed7-ba3d-cd24f92ce1cc	e94328e3491e74d82786c7b934201673a789439af96442017fd81abf55fdb119	2026-04-28 18:17:53.989678+05:30	20260428180000_stone_inventory_parity	\N	\N	2026-04-28 18:17:53.928343+05:30	1
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, user_id, date, check_in_time, check_in_photo, check_in_lat, check_in_lng, check_in_device, check_out_time, check_out_photo, check_out_lat, check_out_lng, check_out_device, total_hours, overtime_hours, status, is_late, late_minutes, is_early_out, early_minutes, approved_by_id, approved_at, notes, created_at, updated_at) FROM stdin;
7bb5ca85-1c1c-42a7-b1c3-89eb33338201	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-27	2026-04-27 21:02:58.595	data:image/jpeg;base64,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	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	\N	\N	\N	\N	\N	\N	PRESENT	f	\N	f	\N	\N	\N	\N	2026-04-27 21:02:58.596	2026-04-27 21:02:58.596
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, "entityType", "entityId", action, "userId", "oldValues", "newValues", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, user_id, business_name, business_type, gst_number, pan_number, contact_person, phone, alternate_phone, address, city, state, pincode, registration_method, approval_status, approved_by_id, approved_at, rejection_reason, notify_by_email, notify_by_sms, notify_by_whatsapp, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: department_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_tracking (id, "orderId", "departmentName", "sequenceOrder", status, "assignedToId", "queuePosition", "queuedAt", "goldWeightIn", "goldWeightOut", "goldLoss", "estimatedHours", "startedAt", "completedAt", notes, photos, issues, "createdAt", "updatedAt") FROM stdin;
ee58cae9-7d3c-4d8c-95a4-19e9704f2e49	c8b78606-34d4-457c-84e6-246d5a0d0af9	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	146.67	146.28	0.39	17.77	2026-04-04 14:24:09.129	2026-04-06 01:24:09.129	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00001-CAD/400/400}	\N	2026-04-04 14:24:09.129	2026-04-06 01:24:09.129
c1206968-4ecc-47af-868f-07eb541ad649	c8b78606-34d4-457c-84e6-246d5a0d0af9	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	146.28	146.1	0.18	15.74	2026-04-05 14:24:09.129	2026-04-06 21:24:09.129	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00001-PRINT/400/400}	\N	2026-04-04 14:24:09.129	2026-04-06 21:24:09.129
74827abb-2261-4a9c-8274-1247d343c4fb	c8b78606-34d4-457c-84e6-246d5a0d0af9	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	146.1	146.02	0.08	4.62	2026-04-06 14:24:09.129	2026-04-08 13:24:09.129	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00001-CASTING/400/400}	\N	2026-04-04 14:24:09.129	2026-04-08 13:24:09.129
9637c437-9534-44af-a36d-18d6437b494c	c8b78606-34d4-457c-84e6-246d5a0d0af9	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	146.02	145.81	0.21	22.88	2026-04-07 14:24:09.129	2026-04-08 16:24:09.129	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00001-FILLING/400/400}	\N	2026-04-04 14:24:09.129	2026-04-08 16:24:09.129
ff26b3e7-f44f-4190-bbb7-9eb2c1a561ad	c8b78606-34d4-457c-84e6-246d5a0d0af9	MEENA	5	IN_PROGRESS	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	145.81	\N	\N	4.65	2026-04-08 14:24:09.129	\N	Currently working on MEENA process.	{https://picsum.photos/seed/gold-dept-ORD-2026-00001-MEENA/400/400}	\N	2026-04-04 14:24:09.129	2026-04-08 14:24:09.129
8885b065-42ed-4a18-8a7f-d19a43fb0157	a53eac6a-19b9-4f88-8e79-481310197adf	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	144.12	143.66	0.46	5.83	2026-04-02 14:24:09.133	2026-04-02 22:24:09.133	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00002-CAD/400/400}	\N	2026-04-02 14:24:09.133	2026-04-02 22:24:09.133
dad61678-9e2f-4b06-a713-e11a04a9aeff	a53eac6a-19b9-4f88-8e79-481310197adf	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	143.66	143.34	0.32	6.37	2026-04-03 14:24:09.133	2026-04-04 17:24:09.133	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00002-PRINT/400/400}	\N	2026-04-02 14:24:09.133	2026-04-04 17:24:09.133
04402d11-80c5-4254-834e-33b5fb3750a6	a53eac6a-19b9-4f88-8e79-481310197adf	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	143.34	143.24	0.1	12.38	2026-04-04 14:24:09.133	2026-04-06 11:24:09.133	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00002-CASTING/400/400}	\N	2026-04-02 14:24:09.133	2026-04-06 11:24:09.133
4bfddaa6-3efb-411d-af43-016ce873d3b1	a53eac6a-19b9-4f88-8e79-481310197adf	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	143.24	143.19	0.05	13.17	2026-04-05 14:24:09.133	2026-04-07 14:24:09.133	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00002-FILLING/400/400}	\N	2026-04-02 14:24:09.133	2026-04-07 14:24:09.133
e2bf004d-0f28-4e07-aef1-4159722314ea	a53eac6a-19b9-4f88-8e79-481310197adf	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	143.19	142.97	0.22	16.69	2026-04-06 14:24:09.133	2026-04-07 22:24:09.133	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00002-MEENA/400/400}	\N	2026-04-02 14:24:09.133	2026-04-07 22:24:09.133
f13833b5-d1ed-42f6-9a84-ad631abff9b1	a53eac6a-19b9-4f88-8e79-481310197adf	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	142.97	142.5	0.47	14.4	2026-04-07 14:24:09.133	2026-04-08 19:24:09.133	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00002-POLISH_1/400/400}	\N	2026-04-02 14:24:09.133	2026-04-08 19:24:09.133
f21a4bbe-dcdd-4ad6-8e45-25a73850adfd	a53eac6a-19b9-4f88-8e79-481310197adf	SETTING	7	ON_HOLD	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	142.5	\N	\N	19.83	2026-04-08 14:24:09.133	\N	Waiting for customer confirmation on design change.	{https://picsum.photos/seed/gold-dept-ORD-2026-00002-SETTING/400/400}	\N	2026-04-02 14:24:09.133	2026-04-08 14:24:09.133
5b1a4ab9-78db-45de-b948-5aa9ba64dffd	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	22.37	22.29	0.08	23.04	2026-03-03 14:24:09.134	2026-03-05 10:24:09.134	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-CAD/400/400}	\N	2026-03-03 14:24:09.134	2026-03-05 10:24:09.134
3cc93984-fe25-4166-afff-b577628be683	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	22.29	21.9	0.39	9.75	2026-03-04 14:24:09.134	2026-03-05 16:24:09.134	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-PRINT/400/400}	\N	2026-03-03 14:24:09.134	2026-03-05 16:24:09.134
ffdffc88-10ee-4706-bc62-c978a686a2f8	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	21.9	21.82	0.08	4.55	2026-03-05 14:24:09.134	2026-03-07 11:24:09.134	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-CASTING/400/400}	\N	2026-03-03 14:24:09.134	2026-03-07 11:24:09.134
b44b19dc-b2d5-4d43-a83f-8c4a0541d567	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	21.82	21.43	0.39	14.23	2026-03-06 14:24:09.134	2026-03-07 05:24:09.134	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-FILLING/400/400}	\N	2026-03-03 14:24:09.134	2026-03-07 05:24:09.134
851ccfbc-79c5-4aeb-a082-03ba6740850a	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	21.43	21.35	0.08	3.1	2026-03-07 14:24:09.134	2026-03-08 23:24:09.134	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-MEENA/400/400}	\N	2026-03-03 14:24:09.134	2026-03-08 23:24:09.134
b645d14a-c5d0-4588-afe0-1e6bb548bfed	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	21.35	21.08000000000001	0.27	20.66	2026-03-08 14:24:09.134	2026-03-09 10:24:09.134	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-POLISH_1/400/400}	\N	2026-03-03 14:24:09.134	2026-03-09 10:24:09.134
d8d85932-2b65-4861-a1d5-4988e36fad4a	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	SETTING	7	COMPLETED	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	21.08000000000001	20.89	0.19	6.34	2026-03-09 14:24:09.134	2026-03-11 07:24:09.134	SETTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-SETTING/400/400}	\N	2026-03-03 14:24:09.134	2026-03-11 07:24:09.134
bb6b1381-094a-46c0-bf21-2056ab176831	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	POLISH_2	8	IN_PROGRESS	0f5c6a35-7b07-40bd-ae0e-4972d83689c4	\N	\N	20.89	\N	\N	15.88	2026-03-10 14:24:09.134	\N	Currently working on POLISH_2 process.	{https://picsum.photos/seed/gold-dept-ORD-2026-00003-POLISH_2/400/400}	\N	2026-03-03 14:24:09.134	2026-03-10 14:24:09.134
33039a60-a67a-4a5b-ac17-86d63a9e8b0c	d844b6c0-f2fe-4b2b-8855-7038270d1d7e	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	58.18	57.75	0.43	21.64	2026-04-01 14:24:09.135	2026-04-02 10:24:09.135	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00005-CAD/400/400}	\N	2026-04-01 14:24:09.135	2026-04-02 10:24:09.135
c50b7722-c05d-4213-a4da-0f2c3064ed67	d844b6c0-f2fe-4b2b-8855-7038270d1d7e	CASTING	3	ON_HOLD	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	57.39	\N	\N	17.07	2026-04-03 14:24:09.135	\N	Waiting for customer confirmation on design change.	{https://picsum.photos/seed/gold-dept-ORD-2026-00005-CASTING/400/400}	\N	2026-04-01 14:24:09.135	2026-04-03 14:24:09.135
8cf7a775-ad81-4641-98c7-d7821f4ba69c	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	116.17	115.77	0.4	15.17	2026-02-24 14:24:09.136	2026-02-25 07:24:09.136	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-CAD/400/400}	\N	2026-02-24 14:24:09.136	2026-02-25 07:24:09.136
e828dd47-9349-4c83-b3fc-e51dff56caf2	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	115.77	115.38	0.39	19.72	2026-02-25 14:24:09.136	2026-02-25 23:24:09.136	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-PRINT/400/400}	\N	2026-02-24 14:24:09.136	2026-02-25 23:24:09.136
60b6596c-da36-4ebc-9d35-044af8ff65de	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	115.38	114.97	0.41	9.1	2026-02-26 14:24:09.136	2026-02-27 02:24:09.136	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-CASTING/400/400}	\N	2026-02-24 14:24:09.136	2026-02-27 02:24:09.136
3eb7a498-b67d-440c-836d-58d7538f4e14	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	114.97	114.96	0.01	8.19	2026-02-27 14:24:09.136	2026-02-28 15:24:09.136	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-FILLING/400/400}	\N	2026-02-24 14:24:09.136	2026-02-28 15:24:09.136
e1fb8c0d-7d01-4096-8aa7-61ff6aba8ed0	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	114.96	114.64	0.32	5.96	2026-02-28 14:24:09.136	2026-03-01 02:24:09.136	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-MEENA/400/400}	\N	2026-02-24 14:24:09.136	2026-03-01 02:24:09.136
a974604f-88f6-48e4-874a-fd4dbddcb8b9	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	114.64	114.27	0.37	3.45	2026-03-01 14:24:09.136	2026-03-03 10:24:09.136	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-POLISH_1/400/400}	\N	2026-02-24 14:24:09.136	2026-03-03 10:24:09.136
3fe163f4-6179-4cd4-9ff1-c6ee95d8e8d8	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	SETTING	7	COMPLETED	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	114.27	113.95	0.32	19.62	2026-03-02 14:24:09.136	2026-03-04 01:24:09.136	SETTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-SETTING/400/400}	\N	2026-02-24 14:24:09.136	2026-03-04 01:24:09.136
a8e051f8-0ba0-46b8-8deb-628847947710	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	POLISH_2	8	COMPLETED	0f5c6a35-7b07-40bd-ae0e-4972d83689c4	\N	\N	113.95	113.46	0.49	17.1	2026-03-03 14:24:09.136	2026-03-05 10:24:09.136	POLISH_2 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-POLISH_2/400/400}	\N	2026-02-24 14:24:09.136	2026-03-05 10:24:09.136
94eb0a52-b138-4407-b9b4-d90b202d5f2c	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	ADDITIONAL	9	COMPLETED	549359df-dc72-4a9c-be54-7f630177ec39	\N	\N	113.46	113.17	0.29	9.04	2026-03-04 14:24:09.136	2026-03-04 20:24:09.136	ADDITIONAL work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00006-ADDITIONAL/400/400}	\N	2026-02-24 14:24:09.136	2026-03-04 20:24:09.136
020ee6a5-89cb-45bd-99ba-1f030a2b3453	465b5321-f738-423b-969b-dd6e42ac9e1a	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	66.74	66.55999999999999	0.18	4.04	2026-03-17 14:24:09.137	2026-03-17 21:24:09.137	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-CAD/400/400}	\N	2026-03-17 14:24:09.137	2026-03-17 21:24:09.137
da65e8ba-a2c3-4f66-bd16-761f0135ecc9	465b5321-f738-423b-969b-dd6e42ac9e1a	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	66.55999999999999	66.37999999999998	0.18	10.61	2026-03-18 14:24:09.137	2026-03-19 19:24:09.137	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-PRINT/400/400}	\N	2026-03-17 14:24:09.137	2026-03-19 19:24:09.137
19aa9357-336d-4b37-9889-97afcb4f29ce	465b5321-f738-423b-969b-dd6e42ac9e1a	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	66.37999999999998	66.32999999999998	0.05	2.52	2026-03-19 14:24:09.137	2026-03-20 17:24:09.137	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-CASTING/400/400}	\N	2026-03-17 14:24:09.137	2026-03-20 17:24:09.137
f5c1a791-03a0-4061-808f-5f769a57d27a	465b5321-f738-423b-969b-dd6e42ac9e1a	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	66.32999999999998	66.16999999999999	0.16	8.88	2026-03-20 14:24:09.137	2026-03-21 00:24:09.137	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-FILLING/400/400}	\N	2026-03-17 14:24:09.137	2026-03-21 00:24:09.137
2a2bfde8-3f01-41fe-8404-ea412eb9cef5	465b5321-f738-423b-969b-dd6e42ac9e1a	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	66.16999999999999	65.90999999999998	0.26	23.19	2026-03-21 14:24:09.137	2026-03-21 23:24:09.137	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-MEENA/400/400}	\N	2026-03-17 14:24:09.137	2026-03-21 23:24:09.137
91eff2e3-703b-4e50-91cc-b58974aa615f	465b5321-f738-423b-969b-dd6e42ac9e1a	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	65.90999999999998	65.86999999999998	0.04	7.26	2026-03-22 14:24:09.137	2026-03-22 22:24:09.137	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-POLISH_1/400/400}	\N	2026-03-17 14:24:09.137	2026-03-22 22:24:09.137
bd805f9b-d079-4bce-9a86-f50d61621343	465b5321-f738-423b-969b-dd6e42ac9e1a	SETTING	7	COMPLETED	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	65.86999999999998	65.74999999999997	0.12	10.5	2026-03-23 14:24:09.137	2026-03-24 15:24:09.137	SETTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-SETTING/400/400}	\N	2026-03-17 14:24:09.137	2026-03-24 15:24:09.137
ee264af6-26ea-4143-89e4-358810a09b19	465b5321-f738-423b-969b-dd6e42ac9e1a	POLISH_2	8	COMPLETED	0f5c6a35-7b07-40bd-ae0e-4972d83689c4	\N	\N	65.74999999999997	65.70999999999997	0.04	6.59	2026-03-24 14:24:09.137	2026-03-26 09:24:09.137	POLISH_2 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-POLISH_2/400/400}	\N	2026-03-17 14:24:09.137	2026-03-26 09:24:09.137
98dff28f-380d-4e7c-ad67-afc7ef734a47	465b5321-f738-423b-969b-dd6e42ac9e1a	ADDITIONAL	9	COMPLETED	549359df-dc72-4a9c-be54-7f630177ec39	\N	\N	65.70999999999997	65.29999999999997	0.41	11.26	2026-03-25 14:24:09.137	2026-03-26 01:24:09.137	ADDITIONAL work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00008-ADDITIONAL/400/400}	\N	2026-03-17 14:24:09.137	2026-03-26 01:24:09.137
7ca0327b-f005-42b6-8ff4-e33626f20463	c696664a-7260-49bb-9927-94845b4c8210	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	36.47	36.02	0.45	15.38	2026-04-05 14:24:09.138	2026-04-07 10:24:09.138	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00010-CAD/400/400}	\N	2026-04-05 14:24:09.138	2026-04-07 10:24:09.138
4e7c6667-6f69-49e9-8641-54f16b9c99b2	c696664a-7260-49bb-9927-94845b4c8210	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	36.02	35.70999999999999	0.31	10.81	2026-04-06 14:24:09.138	2026-04-08 08:24:09.138	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00010-PRINT/400/400}	\N	2026-04-05 14:24:09.138	2026-04-08 08:24:09.138
4d5c8274-694c-490c-9273-356a6f470a7d	c696664a-7260-49bb-9927-94845b4c8210	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	35.70999999999999	35.55	0.16	4.14	2026-04-07 14:24:09.138	2026-04-08 13:24:09.138	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00010-CASTING/400/400}	\N	2026-04-05 14:24:09.138	2026-04-08 13:24:09.138
976115be-0572-417c-9029-7744edc9a982	c696664a-7260-49bb-9927-94845b4c8210	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	35.55	35.33	0.22	6.74	2026-04-08 14:24:09.138	2026-04-09 19:24:09.138	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00010-FILLING/400/400}	\N	2026-04-05 14:24:09.138	2026-04-09 19:24:09.138
46d3a78b-ef66-4205-92d5-7cc5aae9fb9f	c696664a-7260-49bb-9927-94845b4c8210	MEENA	5	IN_PROGRESS	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	35.33	\N	\N	16.44	2026-04-09 14:24:09.138	\N	Currently working on MEENA process.	{https://picsum.photos/seed/gold-dept-ORD-2026-00010-MEENA/400/400}	\N	2026-04-05 14:24:09.138	2026-04-09 14:24:09.138
9a6c1bad-cd94-4883-a121-710192494bfd	7eac58f2-9991-49b4-9516-0cc9852308ad	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	69.47	69.28999999999999	0.18	14.11	2026-03-23 14:24:09.138	2026-03-25 12:24:09.138	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00011-CAD/400/400}	\N	2026-03-23 14:24:09.138	2026-03-25 12:24:09.138
9932ce0b-f099-483d-99f0-19725e786522	7eac58f2-9991-49b4-9516-0cc9852308ad	CASTING	3	ON_HOLD	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	69.08999999999999	\N	\N	17.33	2026-03-25 14:24:09.138	\N	Waiting for customer confirmation on design change.	{https://picsum.photos/seed/gold-dept-ORD-2026-00011-CASTING/400/400}	\N	2026-03-23 14:24:09.138	2026-03-25 14:24:09.138
80226ec2-ea64-497b-a10d-613dfbc36d08	e0cb851e-66de-410f-b4cd-5e746bddb073	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	48.09	47.82	0.27	6.33	2026-02-22 14:24:09.139	2026-02-23 07:24:09.139	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00012-CAD/400/400}	\N	2026-02-22 14:24:09.139	2026-02-23 07:24:09.139
2af13f14-1f65-41c6-ba89-7404b21269af	e0cb851e-66de-410f-b4cd-5e746bddb073	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	47.82	47.5	0.32	16.04	2026-02-23 14:24:09.139	2026-02-25 14:24:09.139	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00012-PRINT/400/400}	\N	2026-02-22 14:24:09.139	2026-02-25 14:24:09.139
b89b3c84-dc3d-4a94-8dfe-e1143b5d4237	e0cb851e-66de-410f-b4cd-5e746bddb073	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	47.5	47.48	0.02	21.85	2026-02-24 14:24:09.139	2026-02-26 00:24:09.139	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00012-CASTING/400/400}	\N	2026-02-22 14:24:09.139	2026-02-26 00:24:09.139
2c795687-c530-4e3d-8adc-5449910be2bd	e0cb851e-66de-410f-b4cd-5e746bddb073	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	47.48	47.15	0.33	20.19	2026-02-25 14:24:09.139	2026-02-26 21:24:09.139	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00012-FILLING/400/400}	\N	2026-02-22 14:24:09.139	2026-02-26 21:24:09.139
c80353ed-2f96-43af-8e7a-786637c014b1	e0cb851e-66de-410f-b4cd-5e746bddb073	MEENA	5	IN_PROGRESS	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	47.15	\N	\N	21.25	2026-02-26 14:24:09.139	\N	Currently working on MEENA process.	{https://picsum.photos/seed/gold-dept-ORD-2026-00012-MEENA/400/400}	\N	2026-02-22 14:24:09.139	2026-02-26 14:24:09.139
9a299a58-4f19-4969-b182-e6a838b36cc9	431cadcb-229a-4180-bd78-794b8782d664	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	94	93.76	0.24	2.14	2026-02-21 14:24:09.14	2026-02-23 05:24:09.14	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00013-CAD/400/400}	\N	2026-02-21 14:24:09.14	2026-02-23 05:24:09.14
57be61b9-2caf-4c93-937c-5d9343c34f14	431cadcb-229a-4180-bd78-794b8782d664	CASTING	3	ON_HOLD	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	93.56	\N	\N	18.91	2026-02-23 14:24:09.14	\N	Waiting for customer confirmation on design change.	{https://picsum.photos/seed/gold-dept-ORD-2026-00013-CASTING/400/400}	\N	2026-02-21 14:24:09.14	2026-02-23 14:24:09.14
f2d9c68a-f242-4562-a26d-59724d739054	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	140.82	140.48	0.34	19.33	2026-04-11 14:24:09.14	2026-04-13 14:24:09.14	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-CAD/400/400}	\N	2026-04-11 14:24:09.14	2026-04-13 14:24:09.14
2c21b02b-1f5a-41f4-b216-63ebca3ad18e	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	140.48	140.2	0.28	14.84	2026-04-12 14:24:09.14	2026-04-13 10:24:09.14	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-PRINT/400/400}	\N	2026-04-11 14:24:09.14	2026-04-13 10:24:09.14
e57e1bd8-ff69-4e60-af71-6d8e49ce9bba	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	140.2	139.74	0.46	2	2026-04-13 14:24:09.14	2026-04-14 03:24:09.14	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-CASTING/400/400}	\N	2026-04-11 14:24:09.14	2026-04-14 03:24:09.14
fc81f978-addc-4b2d-b364-2f7636920485	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	139.74	139.58	0.16	2.76	2026-04-14 14:24:09.14	2026-04-14 21:24:09.14	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-FILLING/400/400}	\N	2026-04-11 14:24:09.14	2026-04-14 21:24:09.14
5ad98460-bbea-4f87-a425-6317f3956815	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	139.58	139.35	0.23	13.41	2026-04-15 14:24:09.14	2026-04-16 04:24:09.14	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-MEENA/400/400}	\N	2026-04-11 14:24:09.14	2026-04-16 04:24:09.14
a4195228-accd-4ba2-b855-e9fb4c2a1bb4	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	139.35	138.91	0.44	7.83	2026-04-16 14:24:09.14	2026-04-18 10:24:09.14	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-POLISH_1/400/400}	\N	2026-04-11 14:24:09.14	2026-04-18 10:24:09.14
d8886aec-b1e3-4fff-a348-188774fdb8fb	431cadcb-229a-4180-bd78-794b8782d664	PRINT	2	IN_PROGRESS	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	93.76	93.56	0.2	22.98	2026-04-26 16:49:09.123	\N	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00013-PRINT/400/400}	\N	2026-02-21 14:24:09.14	2026-04-26 16:49:09.124
0becc1fb-c400-47e7-9dfb-4700068e610a	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	SETTING	7	COMPLETED	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	138.91	138.45	0.46	7.16	2026-04-17 14:24:09.14	2026-04-18 11:24:09.14	SETTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-SETTING/400/400}	\N	2026-04-11 14:24:09.14	2026-04-18 11:24:09.14
daa27148-f958-4c38-9ae8-43a5550e3547	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	POLISH_2	8	ON_HOLD	0f5c6a35-7b07-40bd-ae0e-4972d83689c4	\N	\N	138.45	\N	\N	5.89	2026-04-18 14:24:09.14	\N	Waiting for customer confirmation on design change.	{https://picsum.photos/seed/gold-dept-ORD-2026-00014-POLISH_2/400/400}	\N	2026-04-11 14:24:09.14	2026-04-18 14:24:09.14
e9fe8eca-fc8d-47be-97bd-1a52fc0da326	b34bee3d-8f21-49ec-bf32-821788a16654	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	22.59	22.56	0.03	7.06	2026-03-13 14:24:09.141	2026-03-14 11:24:09.141	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-CAD/400/400}	\N	2026-03-13 14:24:09.141	2026-03-14 11:24:09.141
5fcdb89e-3e40-4b17-881d-e06736edd921	b34bee3d-8f21-49ec-bf32-821788a16654	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	22.56	22.5	0.06	4.24	2026-03-14 14:24:09.141	2026-03-15 02:24:09.141	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-PRINT/400/400}	\N	2026-03-13 14:24:09.141	2026-03-15 02:24:09.141
d7f126c9-74c5-4fd8-844e-00f7bd4d4b25	b34bee3d-8f21-49ec-bf32-821788a16654	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	22.5	22.19	0.31	11.69	2026-03-15 14:24:09.141	2026-03-16 16:24:09.141	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-CASTING/400/400}	\N	2026-03-13 14:24:09.141	2026-03-16 16:24:09.141
bda321c9-e454-42b0-8fff-cabb5c1aea02	b34bee3d-8f21-49ec-bf32-821788a16654	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	22.19	21.83	0.36	20.02	2026-03-16 14:24:09.141	2026-03-18 14:24:09.141	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-FILLING/400/400}	\N	2026-03-13 14:24:09.141	2026-03-18 14:24:09.141
48ddcb46-b177-4cd7-b9d2-bb5ba0705cdc	b34bee3d-8f21-49ec-bf32-821788a16654	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	21.83	21.73	0.1	19.9	2026-03-17 14:24:09.141	2026-03-19 07:24:09.141	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-MEENA/400/400}	\N	2026-03-13 14:24:09.141	2026-03-19 07:24:09.141
6b904b97-62aa-41b0-ad5c-140bdf48765f	b34bee3d-8f21-49ec-bf32-821788a16654	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	21.73	21.36	0.37	12.56	2026-03-18 14:24:09.141	2026-03-20 08:24:09.141	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-POLISH_1/400/400}	\N	2026-03-13 14:24:09.141	2026-03-20 08:24:09.141
3fe58885-eeba-4609-b8bb-1bceb7b36404	b34bee3d-8f21-49ec-bf32-821788a16654	SETTING	7	COMPLETED	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	21.36	20.86	0.5	12.27	2026-03-19 14:24:09.141	2026-03-19 23:24:09.141	SETTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-SETTING/400/400}	\N	2026-03-13 14:24:09.141	2026-03-19 23:24:09.141
25c68d0c-0ad5-443a-8155-25b39b3def48	b34bee3d-8f21-49ec-bf32-821788a16654	POLISH_2	8	COMPLETED	0f5c6a35-7b07-40bd-ae0e-4972d83689c4	\N	\N	20.86	20.64	0.22	15.96	2026-03-20 14:24:09.141	2026-03-22 13:24:09.141	POLISH_2 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-POLISH_2/400/400}	\N	2026-03-13 14:24:09.141	2026-03-22 13:24:09.141
4dfa8722-698d-419b-af5a-f5ec59a4f2e2	b34bee3d-8f21-49ec-bf32-821788a16654	ADDITIONAL	9	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	20.64	20.49	0.15	8.78	2026-03-21 14:24:09.141	2026-03-22 02:24:09.141	ADDITIONAL work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00015-ADDITIONAL/400/400}	\N	2026-03-13 14:24:09.141	2026-03-22 02:24:09.141
067de4d5-ecdf-4f20-b3fa-2a58ac5556f9	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	11.72	11.44	0.28	9.87	2026-03-15 14:24:09.141	2026-03-17 12:24:09.141	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-CAD/400/400}	\N	2026-03-15 14:24:09.141	2026-03-17 12:24:09.141
0a76a6a5-3ea2-43e5-a704-086ee58aaa3d	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	11.44	11.01	0.43	22.99	2026-03-16 14:24:09.141	2026-03-17 18:24:09.141	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-PRINT/400/400}	\N	2026-03-15 14:24:09.141	2026-03-17 18:24:09.141
6c2611ea-4d26-4424-bca7-db35ab48354c	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	11.01	10.85	0.16	2.66	2026-03-17 14:24:09.141	2026-03-18 20:24:09.141	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-CASTING/400/400}	\N	2026-03-15 14:24:09.141	2026-03-18 20:24:09.141
2d0ccf74-a802-442c-9131-5bd9a6efbb37	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	10.85	10.76	0.09	20.02	2026-03-18 14:24:09.141	2026-03-19 21:24:09.141	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-FILLING/400/400}	\N	2026-03-15 14:24:09.141	2026-03-19 21:24:09.141
05bebca5-8ffa-4c84-8524-fb5d3d25ad23	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	10.76	10.43	0.33	10.26	2026-03-19 14:24:09.141	2026-03-19 20:24:09.141	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-MEENA/400/400}	\N	2026-03-15 14:24:09.141	2026-03-19 20:24:09.141
48798b40-c68b-42a8-8540-d754af115420	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	10.43	10.25	0.18	22.99	2026-03-20 14:24:09.141	2026-03-22 00:24:09.141	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-POLISH_1/400/400}	\N	2026-03-15 14:24:09.141	2026-03-22 00:24:09.141
131d6ab7-8c54-4f60-a88a-0baf84495f60	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	SETTING	7	COMPLETED	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	10.25	9.980000000000002	0.27	23.85	2026-03-21 14:24:09.141	2026-03-22 08:24:09.141	SETTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-SETTING/400/400}	\N	2026-03-15 14:24:09.141	2026-03-22 08:24:09.141
4598ce54-6b97-4bf5-9916-1494adda651a	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	POLISH_2	8	COMPLETED	0f5c6a35-7b07-40bd-ae0e-4972d83689c4	\N	\N	9.980000000000002	9.750000000000002	0.23	23.87	2026-03-22 14:24:09.141	2026-03-23 12:24:09.141	POLISH_2 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-POLISH_2/400/400}	\N	2026-03-15 14:24:09.141	2026-03-23 12:24:09.141
ce0e7c4e-3b8d-4927-9ebd-8778c020aa7c	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	ADDITIONAL	9	COMPLETED	549359df-dc72-4a9c-be54-7f630177ec39	\N	\N	9.750000000000002	9.730000000000002	0.02	3.65	2026-03-23 14:24:09.141	2026-03-24 04:24:09.141	ADDITIONAL work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00016-ADDITIONAL/400/400}	\N	2026-03-15 14:24:09.141	2026-03-24 04:24:09.141
f01cdd69-396f-4a26-9877-d71f09ac53a0	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	57.67	57.54	0.13	10.25	2026-03-01 14:24:09.142	2026-03-02 12:24:09.142	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00017-CAD/400/400}	\N	2026-03-01 14:24:09.142	2026-03-02 12:24:09.142
c8c73306-abbb-4bcf-8d26-ad9f98e82a5d	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	57.54	57.19	0.35	6.95	2026-03-02 14:24:09.142	2026-03-03 14:24:09.142	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00017-PRINT/400/400}	\N	2026-03-01 14:24:09.142	2026-03-03 14:24:09.142
3d743ab9-3f29-4dad-b17f-e1b9af3ca65c	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	57.19	56.94	0.25	4.26	2026-03-03 14:24:09.142	2026-03-05 00:24:09.142	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00017-CASTING/400/400}	Minor adjustment required. Resolved.	2026-03-01 14:24:09.142	2026-03-05 00:24:09.142
98ca9b7e-4e5d-4b18-8472-fc480a1ffa2f	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	56.94	56.65	0.29	21.49	2026-03-04 14:24:09.142	2026-03-05 02:24:09.142	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00017-FILLING/400/400}	\N	2026-03-01 14:24:09.142	2026-03-05 02:24:09.142
0af0ab17-d15b-4c20-9fae-a18890ba2ea1	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	56.65	56.48	0.17	17.95	2026-03-05 14:24:09.142	2026-03-05 22:24:09.142	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00017-MEENA/400/400}	\N	2026-03-01 14:24:09.142	2026-03-05 22:24:09.142
dee0f925-6a02-4d1b-9089-3cff95ba215c	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	56.48	56.16999999999999	0.31	18.22	2026-03-06 14:24:09.142	2026-03-07 18:24:09.142	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00017-POLISH_1/400/400}	\N	2026-03-01 14:24:09.142	2026-03-07 18:24:09.142
01dd500c-947f-4811-9286-c451b908dac5	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	SETTING	7	ON_HOLD	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	56.16999999999999	\N	\N	2.22	2026-03-07 14:24:09.142	\N	Waiting for customer confirmation on design change.	{https://picsum.photos/seed/gold-dept-ORD-2026-00017-SETTING/400/400}	\N	2026-03-01 14:24:09.142	2026-03-07 14:24:09.142
31699492-d7f3-4b15-95f1-e2404a642828	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	91.86	91.42999999999999	0.43	15.25	2026-03-05 14:24:09.142	2026-03-07 01:24:09.142	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-CAD/400/400}	\N	2026-03-05 14:24:09.142	2026-03-07 01:24:09.142
bfd2f10b-a421-4db2-9bfa-39b3d7d3a5b4	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	91.42999999999999	91.11	0.32	8.19	2026-03-06 14:24:09.142	2026-03-07 11:24:09.142	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-PRINT/400/400}	\N	2026-03-05 14:24:09.142	2026-03-07 11:24:09.142
42e909bf-eabe-41c8-b937-1a3f61df2ab7	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	CASTING	3	COMPLETED	e0ac9b4b-d403-43a2-b31e-090c288fad4e	\N	\N	91.11	90.94	0.17	17.52	2026-03-07 14:24:09.142	2026-03-09 07:24:09.142	CASTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-CASTING/400/400}	\N	2026-03-05 14:24:09.142	2026-03-09 07:24:09.142
f7c7bd8b-9842-4673-8081-26e1b07bf24f	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	FILLING	4	COMPLETED	bfc4ace0-d29c-4544-9439-6363ccad6179	\N	\N	90.94	90.77	0.17	17.61	2026-03-08 14:24:09.142	2026-03-08 20:24:09.142	FILLING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-FILLING/400/400}	\N	2026-03-05 14:24:09.142	2026-03-08 20:24:09.142
87bd8780-5e07-495b-a824-3eccb1ae6080	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	MEENA	5	COMPLETED	2a905102-2728-452b-95a7-0e088a8ed5b2	\N	\N	90.77	90.33999999999999	0.43	11.46	2026-03-09 14:24:09.142	2026-03-10 10:24:09.142	MEENA work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-MEENA/400/400}	\N	2026-03-05 14:24:09.142	2026-03-10 10:24:09.142
726080f1-5d9e-4b05-8abc-75d98a3ecbf7	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	POLISH_1	6	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	90.33999999999999	90.24	0.1	2.05	2026-03-10 14:24:09.142	2026-03-11 08:24:09.142	POLISH_1 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-POLISH_1/400/400}	\N	2026-03-05 14:24:09.142	2026-03-11 08:24:09.142
af6c09b0-ca7b-4313-9baa-31835bb74d46	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	SETTING	7	COMPLETED	717f02ad-f912-4fa4-9948-e2cc41feca86	\N	\N	90.24	90.03	0.21	6.03	2026-03-11 14:24:09.142	2026-03-12 15:24:09.142	SETTING work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-SETTING/400/400}	\N	2026-03-05 14:24:09.142	2026-03-12 15:24:09.142
cde81f74-b0b7-484c-89bc-c00437e65f9c	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	POLISH_2	8	COMPLETED	0f5c6a35-7b07-40bd-ae0e-4972d83689c4	\N	\N	90.03	89.93	0.1	4.2	2026-03-12 14:24:09.142	2026-03-13 16:24:09.142	POLISH_2 work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-POLISH_2/400/400}	\N	2026-03-05 14:24:09.142	2026-03-13 16:24:09.142
7906c89e-b771-4dc2-a564-fda097f27f45	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	ADDITIONAL	9	COMPLETED	bd61c429-75d0-4877-ab03-48ed74063952	\N	\N	89.93	89.66000000000001	0.27	2.44	2026-03-13 14:24:09.142	2026-03-15 09:24:09.142	ADDITIONAL work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00018-ADDITIONAL/400/400}	\N	2026-03-05 14:24:09.142	2026-03-15 09:24:09.142
fbac3702-6b23-4dc1-bddf-419bdbce5c83	e605ca71-ef38-44f9-acb5-780359019180	CAD	1	COMPLETED	67a0c0c5-b392-4a51-babc-a7414447fc70	\N	\N	91.73	91.62	0.11	22.93	2026-04-03 14:24:09.142	2026-04-03 22:24:09.142	CAD work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00019-CAD/400/400}	\N	2026-04-03 14:24:09.142	2026-04-03 22:24:09.142
ccefde62-a000-4d29-b420-d68b35fd5fcf	e605ca71-ef38-44f9-acb5-780359019180	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	91.62	\N	\N	12.65	2026-04-04 14:24:09.142	2026-04-22 15:22:00.298	Currently working on PRINT process.	{https://picsum.photos/seed/gold-dept-ORD-2026-00019-PRINT/400/400}	\N	2026-04-03 14:24:09.142	2026-04-22 15:22:00.299
8d9ecf55-847c-437d-853f-a00191421e09	e605ca71-ef38-44f9-acb5-780359019180	FILLING	4	NOT_STARTED	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 15:22:00.323	2026-04-22 15:22:00.323
13a25fe1-31e7-4c53-969e-b315559eaa80	d844b6c0-f2fe-4b2b-8855-7038270d1d7e	FILLING	4	NOT_STARTED	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 15:22:11.871	2026-04-22 15:22:11.871
8195f1a7-216f-4cb4-80cf-e33fbfdde8dd	7a1fb003-1db5-45b8-9e84-aa6a65a22053	FILLING	4	NOT_STARTED	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 15:22:27.389	2026-04-22 15:22:27.389
c419811a-725e-431a-ac7c-5fc1a430534a	d844b6c0-f2fe-4b2b-8855-7038270d1d7e	PRINT	2	IN_PROGRESS	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	57.75	57.39	0.36	6.54	2026-04-22 15:22:31.658	\N	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00005-PRINT/400/400}	\N	2026-04-01 14:24:09.135	2026-04-22 15:22:31.659
8c9da9b2-929d-4dde-b90a-e8c55df21af7	7eac58f2-9991-49b4-9516-0cc9852308ad	PRINT	2	COMPLETED	d0116fa0-e98c-4483-a7a7-9065d3a3f062	\N	\N	69.28999999999999	69.08999999999999	0.2	21.87	2026-04-22 15:22:34.151	2026-04-22 16:11:38.549	PRINT work completed successfully. Quality check passed.	{https://picsum.photos/seed/gold-dept-ORD-2026-00011-PRINT/400/400}	\N	2026-03-23 14:24:09.138	2026-04-22 16:11:38.55
50831e95-100e-43f9-8488-42d482320538	7eac58f2-9991-49b4-9516-0cc9852308ad	FILLING	4	NOT_STARTED	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 16:11:38.571	2026-04-22 16:11:38.571
6f8037d3-f74d-4c98-9401-62212a8c6e0c	7a1fb003-1db5-45b8-9e84-aa6a65a22053	CAD	1	IN_PROGRESS	549359df-dc72-4a9c-be54-7f630177ec39	\N	\N	20.72	\N	\N	10.82	2026-04-22 19:07:05.714	\N	Waiting for customer confirmation on design change.	{https://picsum.photos/seed/gold-dept-ORD-2026-00020-CAD/400/400}	\N	2026-03-22 14:24:09.143	2026-04-22 19:07:05.715
\.


--
-- Data for Name: department_work_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_work_data (id, "departmentTrackingId", "formData", "uploadedFiles", "uploadedPhotos", "workStartedAt", "workCompletedAt", "timeSpent", "isComplete", "isDraft", "validationErrors", "lastSavedAt", "autoSaveData", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: diamond_lots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diamond_lots (id, lot_number, description, total_pieces, total_carats, avg_price_per_carat, supplier_id, purchase_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: diamond_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diamond_payments (id, transaction_id, amount, payment_mode, cash_amount, neft_amount, neft_utr, neft_bank, neft_date, credit_applied, credit_generated, notes, recorded_by_id, recorded_at) FROM stdin;
07379e30-3d99-4cbc-9a04-b1e72a2086f3	219562cb-163a-4423-b991-19ee5bbbed96	15733.5	CASH	\N	\N	\N	\N	\N	\N	\N	\N	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-28 14:06:43.642
\.


--
-- Data for Name: diamond_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diamond_rates (id, shape, color, clarity, carat_from, carat_to, price_per_carat, effective_date, source, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: diamond_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diamond_transactions (id, diamond_id, transaction_type, from_location, to_location, order_id, worker_id, notes, created_by_id, created_at, department_id, vendor_id, reference_number, carat_weight, price_per_carat, total_value, quantity_pieces, is_billable, payment_mode, payment_status, amount_paid, cash_amount, neft_amount, neft_utr, neft_bank, neft_date, credit_applied, credit_generated) FROM stdin;
219562cb-163a-4423-b991-19ee5bbbed96	a2752433-e2ab-4dc4-b556-c54f87c48958	PURCHASE	\N	\N	\N	\N	\N	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-28 00:00:00	\N	e685cd40-774b-4d9c-a8a2-f491de5aa317	\N	12.75	1234	15733.5	1	\N	\N	COMPLETE	15733.5	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: diamonds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diamonds (id, stock_number, carat_weight, color, clarity, cut, shape, measurements, depth_percent, table_percent, polish, symmetry, fluorescence, certification_lab, cert_number, cert_date, cert_url, price_per_carat, total_price, lot_id, status, current_location, issued_to_order_id, issued_at, created_at, updated_at, category, color_band, total_pieces) FROM stdin;
a2752433-e2ab-4dc4-b556-c54f87c48958	DIA-20260428-125147-001	12.75	G	VS1	\N	ROUND	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1234	15733.5	\N	IN_STOCK	\N	\N	\N	2026-04-28 07:21:47.216	2026-04-28 07:21:47.216	SOLITAIRE	\N	\N
\.


--
-- Data for Name: employee_advances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_advances (id, user_id, amount, reason, given_date, deduction_per_month, total_deducted, remaining_amount, status, approved_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_loans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_loans (id, user_id, loan_amount, interest_rate, tenure, emi_amount, disbursed_date, start_month, total_paid, remaining_amount, status, approved_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_shifts (id, user_id, shift_id, effective_from, effective_to) FROM stdin;
\.


--
-- Data for Name: equipment_maintenance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_maintenance (id, equipment_id, maintenance_type, description, cost, performed_by, performed_at, next_due_date, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: factory_item_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factory_item_categories (id, name, description, parent_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: factory_item_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factory_item_transactions (id, item_id, transaction_type, quantity, rate, total_value, department_id, worker_id, vendor_id, reference_number, notes, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: factory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factory_items (id, item_code, name, description, category_id, unit, current_stock, min_stock, max_stock, reorder_qty, last_purchase_price, avg_price, location, is_equipment, serial_number, purchase_date, warranty_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: feature_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_modules (id, name, display_name, description, icon, is_global, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: feature_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_permissions (id, feature_id, user_id, role, department_id, is_enabled, can_read, can_write, can_delete, enabled_by_id, enabled_at) FROM stdin;
\.


--
-- Data for Name: final_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.final_submissions (id, "orderId", "finalGoldWeight", "finalStoneWeight", "finalPurity", "numberOfPieces", "totalWeight", "qualityGrade", "qualityNotes", "completionPhotos", "certificateUrl", "submittedById", "submittedAt", "customerApproved", "approvalDate", "approvalNotes", "createdAt", "updatedAt") FROM stdin;
93054870-64bc-4c4d-a252-c0a54133ed70	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	114.72	135.67	14	4	250.39	A	Quality inspection passed. All specifications met. Ready for delivery.	{https://picsum.photos/seed/gold-final-ORD-2026-00006-1/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00006-2/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00006-3/800/800}	https://certificates.goldfactory.com/ORD-2026-00006.pdf	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-03-28 14:24:09.136	t	2026-04-02 14:24:09.136	\N	2026-03-28 14:24:09.136	2026-03-28 14:24:09.136
b87bf91b-44f7-4654-9225-8e55ec02b5f1	465b5321-f738-423b-969b-dd6e42ac9e1a	65.74	0	18	4	65.74	B	Quality inspection passed. All specifications met. Ready for delivery.	{https://picsum.photos/seed/gold-final-ORD-2026-00008-1/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00008-2/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00008-3/800/800}	\N	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-26 14:24:09.137	t	\N	Customer satisfied with the final product.	2026-04-26 14:24:09.137	2026-04-26 14:24:09.137
4331ef15-ff89-4455-bdba-1f3c18589c61	b34bee3d-8f21-49ec-bf32-821788a16654	19.69	59.28	24	4	78.97	A	Quality inspection passed. All specifications met. Ready for delivery.	{https://picsum.photos/seed/gold-final-ORD-2026-00015-1/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00015-2/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00015-3/800/800}	\N	8e91f0bf-2795-46ec-a1bf-18dd8f60da19	2026-04-15 14:24:09.141	t	2026-04-18 14:24:09.141	\N	2026-04-15 14:24:09.141	2026-04-15 14:24:09.141
bc3fa491-4491-4eb5-ab2f-0c7f51e6c3d1	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	8.77	0	14	1	8.77	A	Quality inspection passed. All specifications met. Ready for delivery.	{https://picsum.photos/seed/gold-final-ORD-2026-00016-1/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00016-2/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00016-3/800/800}	https://certificates.goldfactory.com/ORD-2026-00016.pdf	8765c0ba-93fa-4f39-b09b-18bb9228b4e6	2026-03-31 14:24:09.141	t	2026-04-01 14:24:09.141	\N	2026-03-31 14:24:09.141	2026-03-31 14:24:09.141
a7ec237f-4323-4b04-b7f3-93e9cb309dfb	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	88.9	26.1	22	4	115	A	Quality inspection passed. All specifications met. Ready for delivery.	{https://picsum.photos/seed/gold-final-ORD-2026-00018-1/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00018-2/800/800,https://picsum.photos/seed/gold-final-ORD-2026-00018-3/800/800}	\N	b73a96b8-dde4-47a6-b8ea-eb47fdbfbae9	2026-04-07 14:24:09.142	t	\N	Customer satisfied with the final product.	2026-04-07 14:24:09.142	2026-04-07 14:24:09.142
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.holidays (id, name, date, is_optional, created_at) FROM stdin;
\.


--
-- Data for Name: leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leaves (id, user_id, leave_type, start_date, end_date, total_days, reason, status, approved_by_id, approved_at, rejection_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: melting_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.melting_batches (id, batch_number, input_metals, total_input_weight, output_purity, output_weight, output_form, wastage_weight, wastage_percent, melted_by_id, melted_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: metal_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metal_payments (id, transaction_id, amount, payment_mode, cash_amount, neft_amount, neft_utr, neft_bank, neft_date, credit_applied, credit_generated, notes, recorded_by_id, recorded_at) FROM stdin;
a9435cb0-7a52-4d8e-8179-3911781022d0	7f589ce7-239a-4466-910e-1eca988df055	35000	CASH	\N	\N	\N	\N	\N	\N	\N	\N	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-28 16:26:46.802
\.


--
-- Data for Name: metal_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metal_rates (id, metal_type, purity, rate_per_gram, effective_date, source, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: metal_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metal_stock (id, metal_type, purity, form, gross_weight, pure_weight, location, batch_number, created_at, updated_at) FROM stdin;
d03b4c8a-de2d-485d-bd41-77e40e697ae2	PLATINUM	24	BAR	0	0	\N	\N	2026-04-24 13:33:42.927	2026-04-24 13:51:06.929
896cdcfb-3d99-4023-9a07-d20e95ed471b	SILVER	24	BAR	4500.234	4500.234	\N	\N	2026-04-24 12:53:46.874	2026-04-24 15:25:26.262
d417a71b-4aa4-4fa0-a9d6-223b568b7e12	GOLD	24	BAR	435.235	435.235	\N	\N	2026-04-24 12:53:46.872	2026-04-28 16:25:10.22
\.


--
-- Data for Name: metal_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metal_transactions (id, transaction_type, metal_type, purity, form, gross_weight, pure_weight, rate, total_value, stock_id, order_id, department_id, worker_id, melting_batch_id, notes, reference_number, created_by_id, created_at, vendor_id, amount_paid, cash_amount, credit_applied, credit_generated, is_billable, neft_amount, neft_bank, neft_date, neft_utr, payment_mode, payment_status) FROM stdin;
19a7875a-96f4-48a8-bd4c-e76a53dcea19	PURCHASE	GOLD	24	BAR	100	100	15389	1538900	\N	\N	\N	\N	\N	[Vendor: ativa rtgs (VEN-005)]	125	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-24 00:00:00	6e3ae63a-e5d3-4962-b3ee-aee2f8641631	1538900	\N	\N	61100	t	\N	\N	\N	\N	CASH	COMPLETE
6db72e55-4dc3-496c-81db-ac923c6069bb	PURCHASE	GOLD	24	BAR	35.235	35.235	15391	542301.885	\N	\N	\N	\N	\N	[Vendor: ativa (VEN-004)]		9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-24 00:00:00	7f7dddf8-7d3e-4854-bf21-d5eca75ae01b	542301.89	230000	\N	\N	t	312301.89	kvb	2026-04-21 00:00:00	abcd	BOTH	COMPLETE
aec47f25-62a0-49f3-a24f-a194484fd817	PURCHASE	SILVER	24	BAR	4000	4000	247	988000	\N	\N	\N	\N	\N	[Vendor: Bullion (VEN-001)]		9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-24 00:00:00	4868cdf8-330e-4889-9ed8-a2e544ca60d3	988000	\N	\N	\N	t	\N	\N	\N	\N	CASH	COMPLETE
0eee647a-8345-40d4-842d-0490b5ca7a36	PURCHASE	SILVER	24	BAR	500	500	247	123500	\N	\N	\N	\N	\N	[Vendor: sidharth (VEN-003)]		9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-24 00:00:00	e685cd40-774b-4d9c-a8a2-f491de5aa317	0	\N	\N	\N	t	\N	\N	\N	\N	CASH	PENDING
06180593-78f0-4c5a-a6ac-dd30747b8cb7	PURCHASE	SILVER	24	BAR	0.234	0.234	247	57.798	\N	\N	\N	\N	\N	[Vendor: sidharth (VEN-003)]		9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-24 00:00:00	e685cd40-774b-4d9c-a8a2-f491de5aa317	57.798	\N	\N	\N	t	\N	\N	\N	\N	CASH	COMPLETE
80d1e2ff-a38e-42db-90ee-55c9e03e0a4a	PURCHASE	GOLD	24	BAR	100	100	15075	1507500	\N	\N	\N	\N	\N	[Vendor: YD (VEN-008)]		9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-28 00:00:00	24da4105-5631-464d-9ca0-176fa5262063	1400000	\N	\N	\N	f	\N	\N	\N	\N	CASH	HALF
14b00a40-b895-42b4-bf4c-43e28562a697	PURCHASE	GOLD	24	BAR	100	100	15119	1511900	\N	\N	\N	\N	\N	[Vendor: Bullion (VEN-001)]	25	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-28 00:00:00	4868cdf8-330e-4889-9ed8-a2e544ca60d3	1200000	\N	\N	\N	t	\N	\N	\N	\N	CASH	HALF
7f589ce7-239a-4466-910e-1eca988df055	PURCHASE	GOLD	24	BAR	100	100	15133	1513300	\N	\N	\N	\N	\N	[Vendor: ativa rtgs (VEN-005)]	12	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-28 00:00:00	6e3ae63a-e5d3-4962-b3ee-aee2f8641631	1435000	\N	\N	\N	t	\N	\N	\N	\N	CASH	HALF
\.


--
-- Data for Name: notification_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_queue (id, recipient_id, recipient_type, channel, subject, message, template_id, template_data, status, attempts, last_attempt_at, sent_at, error_message, order_id, scheduled_for, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, "userId", type, priority, title, message, "orderId", "actionUrl", "actionLabel", "isRead", "readAt", "createdAt", "expiresAt", metadata) FROM stdin;
\.


--
-- Data for Name: order_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_activities (id, "orderId", action, title, description, "userId", metadata, "createdAt", "updatedAt") FROM stdin;
172c5be5-725c-4efe-b400-89d554dd8ba8	e605ca71-ef38-44f9-acb5-780359019180	DEPT_COMPLETED	PRINT department completed	PRINT department completed. Order moved to FILLING	\N	{"nextDepartment": "FILLING", "completedDepartment": "PRINT"}	2026-04-22 15:22:00.317	2026-04-22 15:22:00.317
9e2f2df9-fd5e-477e-bcdd-312b4345be9f	e605ca71-ef38-44f9-acb5-780359019180	DEPT_MOVE	Moved from PRINT to FILLING	Order moved from PRINT department to FILLING department	\N	{"toDepartment": "FILLING", "fromDepartment": "PRINT"}	2026-04-22 15:22:00.33	2026-04-22 15:22:00.33
fb3ba2ff-9aa6-4374-978c-4f784c6863ca	d844b6c0-f2fe-4b2b-8855-7038270d1d7e	WORKER_ASSIGNED	Assigned to Ritu Patel (PRINT)	Order assigned to worker Ritu Patel in PRINT department	\N	{"department": "PRINT", "workerName": "Ritu Patel", "isReassignment": false}	2026-04-22 15:22:31.66	2026-04-22 15:22:31.66
c10d7865-f776-4922-9a2a-5d2e550b865b	7eac58f2-9991-49b4-9516-0cc9852308ad	WORKER_ASSIGNED	Assigned to Ritu Patel (PRINT)	Order assigned to worker Ritu Patel in PRINT department	\N	{"department": "PRINT", "workerName": "Ritu Patel", "isReassignment": false}	2026-04-22 15:22:34.152	2026-04-22 15:22:34.152
e9b6ea13-9ae3-4a7d-9175-d1e9ebcac78d	7eac58f2-9991-49b4-9516-0cc9852308ad	DEPT_COMPLETED	PRINT department completed	PRINT department completed. Order moved to FILLING	\N	{"nextDepartment": "FILLING", "completedDepartment": "PRINT"}	2026-04-22 16:11:38.567	2026-04-22 16:11:38.567
c5a39da9-5833-4d07-9b74-5920b7fa1f47	7eac58f2-9991-49b4-9516-0cc9852308ad	DEPT_MOVE	Moved from PRINT to FILLING	Order moved from PRINT department to FILLING department	\N	{"toDepartment": "FILLING", "fromDepartment": "PRINT"}	2026-04-22 16:11:38.572	2026-04-22 16:11:38.572
af0d590f-6abd-4156-9fe5-7839753e4ded	7a1fb003-1db5-45b8-9e84-aa6a65a22053	WORKER_REASSIGNED	Reassigned to Priya Gupta (CAD)	Order assigned to worker Priya Gupta in CAD department	\N	{"department": "CAD", "workerName": "Priya Gupta", "isReassignment": true}	2026-04-22 19:07:05.75	2026-04-22 19:07:05.75
524a961b-f8af-4fee-a1d2-2a8989d1fa5b	431cadcb-229a-4180-bd78-794b8782d664	WORKER_ASSIGNED	Assigned to Ritu Patel (PRINT)	Order assigned to worker Ritu Patel in PRINT department	\N	{"department": "PRINT", "workerName": "Ritu Patel", "isReassignment": false}	2026-04-26 16:49:09.125	2026-04-26 16:49:09.125
\.


--
-- Data for Name: order_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_comments (id, order_id, user_id, message, attachments, is_internal, is_read, read_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_details (id, "orderId", "goldWeightInitial", purity, "goldColor", "metalType", "metalFinish", "customFinish", size, quantity, "productType", "customProductType", "productSpecifications", "cadFiles", "hallmarkRequired", "huidNumber", "bisHallmark", "makingChargeType", "makingChargeValue", "wastagePercentage", "laborCharges", "meltingInstructions", "claspType", "engravingText", "polishType", "rhodiumPlating", "certificationRequired", "usingCustomerGold", "customerGoldWeight", "customerGoldPurity", "deliveryMethod", "customerAddress", occasion, "designCategory", "warrantyPeriod", "exchangeAllowed", "paymentTerms", "advancePercentage", "goldRateLocked", "expectedGoldRate", "estimatedGoldCost", "estimatedStoneCost", "estimatedMakingCharges", "estimatedOtherCharges", "estimatedTotalCost", "templateName", "clonedFromOrderId", "dueDate", "additionalDescription", "specialInstructions", "referenceImages", "enteredById", "createdAt", "updatedAt") FROM stdin;
27d04a89-3d74-4e54-9ab0-73471599a06b	c8b78606-34d4-457c-84e6-246d5a0d0af9	146.67	22	Yellow Gold	GOLD	\N	\N	XS	2	Temple Jewellery Set	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-18 14:24:09.129	Temple Jewellery Set - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00001-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00001-2/400/400}	6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	2026-04-04 14:24:09.129	2026-04-04 14:24:09.129
1955741b-c572-42c2-9146-df22e08ffed7	a53eac6a-19b9-4f88-8e79-481310197adf	144.12	14	White Gold	GOLD	\N	\N	8	3	Toe Rings Set	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 14:24:09.133	Toe Rings Set - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00002-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00002-2/400/400}	6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	2026-04-02 14:24:09.133	2026-04-02 14:24:09.133
8abe47f4-b397-43a4-9312-f6fb2260bf44	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	22.37	24	Rose Gold	GOLD	\N	\N	2.8	2	Armlet (Bajuband)	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-29 14:24:09.134	Armlet (Bajuband) - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00003-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00003-2/400/400}	dd6a3eda-6cbd-406f-a2c4-b5427b6edf40	2026-03-03 14:24:09.134	2026-03-03 14:24:09.134
e51f8e46-ded2-4494-bf66-fe37964a39e8	59256cc2-4482-480f-b6e5-6202f4933da4	122.74	22	Tri-Color	GOLD	\N	\N	XS	4	Toe Rings Set	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-16 14:24:09.135	Toe Rings Set - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00004-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00004-2/400/400}	0e95fb6e-c79a-4d07-9276-71b6dca69cb4	2026-04-16 14:24:09.135	2026-04-16 14:24:09.135
23e309ed-db66-4f75-b39d-e14f527deeec	d844b6c0-f2fe-4b2b-8855-7038270d1d7e	58.18	18	Yellow Gold	GOLD	\N	\N	16 inches	1	Peacock Pendant	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-06 14:24:09.135	Peacock Pendant - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00005-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00005-2/400/400}	6c30adce-e6e1-4721-b505-08d6591f7eba	2026-04-01 14:24:09.135	2026-04-01 14:24:09.135
a3c5d75b-c952-4e05-ae74-02c57c8b1c3e	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	116.17	14	Yellow Gold	GOLD	\N	\N	2.6	4	Nose Ring (Nath)	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-15 14:24:09.136	Nose Ring (Nath) - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00006-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00006-2/400/400}	8e91f0bf-2795-46ec-a1bf-18dd8f60da19	2026-02-24 14:24:09.136	2026-02-24 14:24:09.136
c2d5dfe8-a30f-4d53-856e-fd3603fb0471	dd7d0803-97f1-4427-8db7-e3eec358abc0	46.39	18	Rose Gold	GOLD	\N	\N	18 inches	4	Guttapusalu Set	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-12 14:24:09.137	Guttapusalu Set - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00007-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00007-2/400/400}	ce4f8b64-ada8-443c-815a-e2dd93312bf6	2026-04-19 14:24:09.137	2026-04-19 14:24:09.137
d444bb33-d245-4567-b4bb-259aeff494d8	465b5321-f738-423b-969b-dd6e42ac9e1a	66.74	18	White Gold	GOLD	\N	\N	2.8	4	Lakshmi Haar	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-29 14:24:09.137	Lakshmi Haar - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00008-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00008-2/400/400}	ce4f8b64-ada8-443c-815a-e2dd93312bf6	2026-03-17 14:24:09.137	2026-03-17 14:24:09.137
a6b29b96-e028-4db7-8b76-f1ef580d3a0f	02024325-af09-4cb9-9a43-8f789c688190	82.69	14	Yellow Gold	GOLD	\N	\N	9	4	Polki Choker	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-08 14:24:09.138	Polki Choker - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00009-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00009-2/400/400}	b73a96b8-dde4-47a6-b8ea-eb47fdbfbae9	2026-04-22 14:24:09.138	2026-04-22 14:24:09.138
bc746b8f-050b-40ca-8e9e-587f5fe73787	c696664a-7260-49bb-9927-94845b4c8210	36.47	14	Tri-Color	GOLD	\N	\N	22 inches	1	Peacock Pendant	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-17 14:24:09.138	Peacock Pendant - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00010-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00010-2/400/400}	6c30adce-e6e1-4721-b505-08d6591f7eba	2026-04-05 14:24:09.138	2026-04-05 14:24:09.138
76452c76-468c-4c2a-b54c-f3db0b0e107f	7eac58f2-9991-49b4-9516-0cc9852308ad	69.47	18	Rose Gold	GOLD	\N	\N	2.4	1	Lakshmi Haar	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-11 14:24:09.138	Lakshmi Haar - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00011-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00011-2/400/400}	6c30adce-e6e1-4721-b505-08d6591f7eba	2026-03-23 14:24:09.138	2026-03-23 14:24:09.138
7ef56c0b-a8b5-4ce2-9b20-f745a4ba1eae	e0cb851e-66de-410f-b4cd-5e746bddb073	48.09	14	Yellow Gold	GOLD	\N	\N	2.8	1	Temple Pendant	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-15 14:24:09.139	Temple Pendant - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00012-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00012-2/400/400}	ce4f8b64-ada8-443c-815a-e2dd93312bf6	2026-02-22 14:24:09.139	2026-02-22 14:24:09.139
3882691d-f72c-43a7-93a0-121633b86351	431cadcb-229a-4180-bd78-794b8782d664	94	22	Two-Tone	GOLD	\N	\N	16 inches	2	Nose Ring (Nath)	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 14:24:09.14	Nose Ring (Nath) - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00013-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00013-2/400/400}	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-02-21 14:24:09.14	2026-02-21 14:24:09.14
078ee365-27b5-49ce-8089-ab3be5d137f3	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	140.82	14	White Gold	GOLD	\N	\N	L	3	Thali Chain	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-26 14:24:09.14	Thali Chain - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00014-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00014-2/400/400}	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-11 14:24:09.14	2026-04-11 14:24:09.14
5e374e91-82f1-4f43-9e77-3befb88429b4	b34bee3d-8f21-49ec-bf32-821788a16654	22.59	24	White Gold	GOLD	\N	\N	2.8	4	Chain with Pendant	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-23 14:24:09.141	Chain with Pendant - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00015-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00015-2/400/400}	6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	2026-03-13 14:24:09.141	2026-03-13 14:24:09.141
06c53550-8071-4f7e-afdd-924825b54467	5c2a734c-b844-4ad5-8bad-4ddda926ab7e	11.72	14	Two-Tone	GOLD	\N	\N	2.8	1	Antique Gold Haar	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 14:24:09.141	Antique Gold Haar - Custom design as per customer specifications. Premium finish required.	Handle with extra care. Customer is VIP. Priority processing required.	{https://picsum.photos/seed/gold-ref-ORD-2026-00016-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00016-2/400/400}	6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	2026-03-15 14:24:09.141	2026-03-15 14:24:09.141
90f86197-1c18-485f-9bc3-4fefda3856f4	84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	57.67	22	White Gold	GOLD	\N	\N	L	1	Lakshmi Haar	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 14:24:09.142	Lakshmi Haar - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00017-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00017-2/400/400}	ce4f8b64-ada8-443c-815a-e2dd93312bf6	2026-03-01 14:24:09.142	2026-03-01 14:24:09.142
07d2a0ed-3525-45c8-adc9-4c17b7ecd237	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	91.86	22	Yellow Gold	GOLD	\N	\N	2.8	4	Peacock Pendant	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 14:24:09.142	Peacock Pendant - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00018-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00018-2/400/400}	b73a96b8-dde4-47a6-b8ea-eb47fdbfbae9	2026-03-05 14:24:09.142	2026-03-05 14:24:09.142
d0714ad5-f87f-423c-8a64-511b2e2bf106	e605ca71-ef38-44f9-acb5-780359019180	91.73	14	White Gold	GOLD	\N	\N	XL	1	Chain with Pendant	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-26 14:24:09.142	Chain with Pendant - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00019-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00019-2/400/400}	0e95fb6e-c79a-4d07-9276-71b6dca69cb4	2026-04-03 14:24:09.142	2026-04-03 14:24:09.142
60806e59-e64a-45b4-9ded-3b9b6a3689d5	7a1fb003-1db5-45b8-9e84-aa6a65a22053	20.72	18	White Gold	GOLD	\N	\N	10	1	Mangalsutra	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-03 14:24:09.143	Mangalsutra - Custom design as per customer specifications. Premium finish required.	\N	{https://picsum.photos/seed/gold-ref-ORD-2026-00020-1/400/400,https://picsum.photos/seed/gold-ref-ORD-2026-00020-2/400/400}	0e95fb6e-c79a-4d07-9276-71b6dca69cb4	2026-03-22 14:24:09.143	2026-03-22 14:24:09.143
51d27c06-1588-4af9-bad9-49260e7577cb	474dbdc7-7c13-448e-988b-9afa51226b63	25	22	YELLOW_GOLD	GOLD	YELLOW_GOLD	\N	\N	4	PENDANT	\N	{}	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-07 18:30:00	\N	\N	{"data:image/jpeg;base64,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"}	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-27 20:57:44.921	2026-04-27 20:57:44.921
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "orderNumber", "customerName", "customerPhone", "customerEmail", "productPhotoUrl", status, priority, "currentDepartment", "createdById", "createdAt", "updatedAt", "completedAt", "clientId", "orderSource", "approvalStatus", "approvedById", "approvedAt", "rejectionReason") FROM stdin;
c8b78606-34d4-457c-84e6-246d5a0d0af9	ORD-2026-00001	NAC Jewellers	+91 8890746137	customer1@example.com	https://picsum.photos/seed/gold-order-1/400/400	IN_FACTORY	4	\N	ce4f8b64-ada8-443c-815a-e2dd93312bf6	2026-04-04 14:24:09.129	2026-04-04 14:24:09.129	\N	\N	INTERNAL	\N	\N	\N	\N
a53eac6a-19b9-4f88-8e79-481310197adf	ORD-2026-00002	Malabar Gold Partner	+91 7499983524	customer2@example.com	https://picsum.photos/seed/gold-order-2/400/400	IN_FACTORY	0	\N	ce4f8b64-ada8-443c-815a-e2dd93312bf6	2026-04-02 14:24:09.133	2026-04-02 14:24:09.133	\N	\N	INTERNAL	\N	\N	\N	\N
dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	ORD-2026-00003	Rajeshwari Ornaments	+91 8619792303	customer3@example.com	https://picsum.photos/seed/gold-order-3/400/400	IN_FACTORY	1	\N	ce4f8b64-ada8-443c-815a-e2dd93312bf6	2026-03-03 14:24:09.134	2026-03-03 14:24:09.134	\N	\N	INTERNAL	\N	\N	\N	\N
59256cc2-4482-480f-b6e5-6202f4933da4	ORD-2026-00004	Bhima Jewellers	+91 9075520220	customer4@example.com	https://picsum.photos/seed/gold-order-4/400/400	DRAFT	3	\N	dd6a3eda-6cbd-406f-a2c4-b5427b6edf40	2026-04-16 14:24:09.135	2026-04-16 14:24:09.135	\N	\N	INTERNAL	\N	\N	\N	\N
ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	ORD-2026-00006	Gehna Jewellers	+91 7931295612	customer6@example.com	https://picsum.photos/seed/gold-order-6/400/400	COMPLETED	5	\N	0e95fb6e-c79a-4d07-9276-71b6dca69cb4	2026-02-24 14:24:09.136	2026-02-24 14:24:09.136	\N	\N	INTERNAL	\N	\N	\N	\N
dd7d0803-97f1-4427-8db7-e3eec358abc0	ORD-2026-00007	NAC Jewellers	+91 7761861304	customer7@example.com	https://picsum.photos/seed/gold-order-7/400/400	DRAFT	4	\N	6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	2026-04-19 14:24:09.137	2026-04-19 14:24:09.137	\N	\N	INTERNAL	\N	\N	\N	\N
465b5321-f738-423b-969b-dd6e42ac9e1a	ORD-2026-00008	Waman Hari Pethe	+91 8883739451	customer8@example.com	https://picsum.photos/seed/gold-order-8/400/400	COMPLETED	5	\N	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-03-17 14:24:09.137	2026-03-17 14:24:09.137	\N	\N	INTERNAL	\N	\N	\N	\N
02024325-af09-4cb9-9a43-8f789c688190	ORD-2026-00009	Laxmi Gold House	+91 7437102031	customer9@example.com	https://picsum.photos/seed/gold-order-9/400/400	DRAFT	3	\N	b73a96b8-dde4-47a6-b8ea-eb47fdbfbae9	2026-04-22 14:24:09.138	2026-04-22 14:24:09.138	\N	\N	INTERNAL	\N	\N	\N	\N
c696664a-7260-49bb-9927-94845b4c8210	ORD-2026-00010	Shree Balaji Jewellers	+91 7382394201	customer10@example.com	https://picsum.photos/seed/gold-order-10/400/400	IN_FACTORY	5	\N	6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	2026-04-05 14:24:09.138	2026-04-05 14:24:09.138	\N	\N	INTERNAL	\N	\N	\N	\N
e0cb851e-66de-410f-b4cd-5e746bddb073	ORD-2026-00012	Waman Hari Pethe	+91 8008801309	customer12@example.com	https://picsum.photos/seed/gold-order-12/400/400	IN_FACTORY	0	\N	dd6a3eda-6cbd-406f-a2c4-b5427b6edf40	2026-02-22 14:24:09.139	2026-02-22 14:24:09.139	\N	\N	INTERNAL	\N	\N	\N	\N
3f4dd783-30cd-4ef6-8647-38d7f4d4629f	ORD-2026-00014	Jewels by Rakesh	+91 7909244170	customer14@example.com	https://picsum.photos/seed/gold-order-14/400/400	IN_FACTORY	3	\N	0e95fb6e-c79a-4d07-9276-71b6dca69cb4	2026-04-11 14:24:09.14	2026-04-11 14:24:09.14	\N	\N	INTERNAL	\N	\N	\N	\N
b34bee3d-8f21-49ec-bf32-821788a16654	ORD-2026-00015	Mehrasons Jewellers	+91 7530150834	customer15@example.com	https://picsum.photos/seed/gold-order-15/400/400	COMPLETED	3	\N	6c30adce-e6e1-4721-b505-08d6591f7eba	2026-03-13 14:24:09.141	2026-03-13 14:24:09.141	\N	\N	INTERNAL	\N	\N	\N	\N
5c2a734c-b844-4ad5-8bad-4ddda926ab7e	ORD-2026-00016	Jewels by Rakesh	+91 7884558535	customer16@example.com	https://picsum.photos/seed/gold-order-16/400/400	COMPLETED	0	\N	6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	2026-03-15 14:24:09.141	2026-03-15 14:24:09.141	\N	\N	INTERNAL	\N	\N	\N	\N
84b19aa1-fb46-4de9-badc-8f0e6a0e12e0	ORD-2026-00017	Caratlane Partner	+91 8729015248	customer17@example.com	https://picsum.photos/seed/gold-order-17/400/400	IN_FACTORY	3	\N	b73a96b8-dde4-47a6-b8ea-eb47fdbfbae9	2026-03-01 14:24:09.142	2026-03-01 14:24:09.142	\N	\N	INTERNAL	\N	\N	\N	\N
9f3c64f4-00fa-49de-9ca8-25d913cc7bee	ORD-2026-00018	Senco Gold Works	+91 9943840577	customer18@example.com	https://picsum.photos/seed/gold-order-18/400/400	COMPLETED	1	\N	8e91f0bf-2795-46ec-a1bf-18dd8f60da19	2026-03-05 14:24:09.142	2026-03-05 14:24:09.142	\N	\N	INTERNAL	\N	\N	\N	\N
e605ca71-ef38-44f9-acb5-780359019180	ORD-2026-00019	Mehrasons Jewellers	+91 8201248644	customer19@example.com	https://picsum.photos/seed/gold-order-19/400/400	IN_FACTORY	5	FILLING	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-03 14:24:09.142	2026-04-22 15:22:00.331	\N	\N	INTERNAL	\N	\N	\N	\N
7a1fb003-1db5-45b8-9e84-aa6a65a22053	ORD-2026-00020	Tanishq Partner Store	+91 7448017967	customer20@example.com	https://picsum.photos/seed/gold-order-20/400/400	IN_FACTORY	0	FILLING	dd6a3eda-6cbd-406f-a2c4-b5427b6edf40	2026-03-22 14:24:09.143	2026-04-22 15:22:27.39	\N	\N	INTERNAL	\N	\N	\N	\N
d844b6c0-f2fe-4b2b-8855-7038270d1d7e	ORD-2026-00005	Amrapali Jewels	+91 9969768240	customer5@example.com	https://picsum.photos/seed/gold-order-5/400/400	IN_FACTORY	2	PRINT	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-01 14:24:09.135	2026-04-22 15:22:31.655	\N	\N	INTERNAL	\N	\N	\N	\N
7eac58f2-9991-49b4-9516-0cc9852308ad	ORD-2026-00011	Hazoorilal Jewellers	+91 8026898788	customer11@example.com	https://picsum.photos/seed/gold-order-11/400/400	IN_FACTORY	0	FILLING	dd6a3eda-6cbd-406f-a2c4-b5427b6edf40	2026-03-23 14:24:09.138	2026-04-22 16:11:38.573	\N	\N	INTERNAL	\N	\N	\N	\N
431cadcb-229a-4180-bd78-794b8782d664	ORD-2026-00013	NAC Jewellers	+91 7316603229	customer13@example.com	https://picsum.photos/seed/gold-order-13/400/400	IN_FACTORY	3	PRINT	b73a96b8-dde4-47a6-b8ea-eb47fdbfbae9	2026-02-21 14:24:09.14	2026-04-26 16:49:09.12	\N	\N	INTERNAL	\N	\N	\N	\N
474dbdc7-7c13-448e-988b-9afa51226b63	ORD-2026-00021-F02	Yash Dhona	9108844113	yash.dhona@gmail.com	data:image/jpeg;base64,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	DRAFT	2	\N	9c5a46c5-1a87-4bd1-82d7-da3383cdb612	2026-04-27 20:57:44.921	2026-04-27 20:57:44.921	\N	\N	INTERNAL	\N	\N	\N	\N
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_periods (id, month, year, start_date, end_date, working_days, status, processed_by_id, processed_at, finalized_by_id, finalized_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payslips (id, period_id, user_id, total_days, present_days, absent_days, leave_days, holidays, overtime_hours, late_deductions, basic_earned, hra_earned, da_earned, conveyance_earned, medical_earned, special_earned, other_earned, overtime_pay, bonus, incentive, gross_earnings, advance_deduction, loan_deduction, other_deduction, total_deductions, net_salary, payment_status, payment_date, payment_mode, transaction_ref, payslip_url, emailed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: real_stone_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.real_stone_payments (id, transaction_id, amount, payment_mode, cash_amount, neft_amount, neft_utr, neft_bank, neft_date, credit_applied, credit_generated, notes, recorded_by_id, recorded_at) FROM stdin;
\.


--
-- Data for Name: real_stone_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.real_stone_rates (id, stone_type, quality, carat_from, carat_to, price_per_carat, effective_date, source, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: real_stone_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.real_stone_transactions (id, stone_id, transaction_type, order_id, notes, created_by_id, created_at, amount_paid, carat_weight, cash_amount, credit_applied, credit_generated, department_id, from_location, is_billable, neft_amount, neft_bank, neft_date, neft_utr, payment_mode, payment_status, price_per_carat, reference_number, to_location, total_value, updated_at, vendor_id, worker_id) FROM stdin;
\.


--
-- Data for Name: real_stones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.real_stones (id, stock_number, stone_type, carat_weight, shape, color, clarity, cut, origin, treatment, treatment_notes, cert_lab, cert_number, cert_date, price_per_carat, total_price, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: salary_structures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salary_structures (id, user_id, basic_salary, hra, da, conveyance, medical_allow, special_allow, other_allow, per_day_rate, per_hour_rate, overtime_rate, bank_name, account_number, ifsc_code, effective_from, effective_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id, name, start_time, end_time, break_minutes, grace_minutes, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: specification_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.specification_templates (id, name, "productType", specifications, "userId", "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: stone_packet_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stone_packet_payments (id, transaction_id, amount, payment_mode, cash_amount, neft_amount, neft_utr, neft_bank, neft_date, credit_applied, credit_generated, notes, recorded_by_id, recorded_at) FROM stdin;
\.


--
-- Data for Name: stone_packet_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stone_packet_transactions (id, packet_id, transaction_type, quantity, unit, order_id, worker_id, notes, created_by_id, created_at, amount_paid, cash_amount, credit_applied, credit_generated, department_id, from_location, is_billable, neft_amount, neft_bank, neft_date, neft_utr, payment_mode, payment_status, price_per_unit, reference_number, to_location, total_value, updated_at, vendor_id) FROM stdin;
\.


--
-- Data for Name: stone_packets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stone_packets (id, packet_number, stone_type, shape, size, color, quality, total_pieces, total_weight, unit, current_pieces, current_weight, price_per_unit, reorder_level, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stones (id, "orderId", "stoneType", "stoneName", "customType", weight, quantity, color, clarity, cut, shape, "customShape", setting, "customSetting", notes, "createdAt", "updatedAt") FROM stdin;
6681b020-12d9-4362-b28c-468ac566fc35	a53eac6a-19b9-4f88-8e79-481310197adf	KUNDAN	\N	\N	4.63	4	Red	\N	Pear	Triangle	\N	Flush	\N	\N	2026-04-02 14:24:09.133	2026-04-02 14:24:09.133
11349270-740c-4f28-84f9-ff66c1942fe4	dbbec3fa-4660-4471-b8b2-c8f7fb1424c0	DIAMOND	Stone-ORD-2026-00003-1	\N	2.6	17	Multi	VS2	Rose	Heart	\N	Prong	\N	Natural certified stones. Handle with care.	2026-03-03 14:24:09.134	2026-03-03 14:24:09.134
5b212b88-0eb9-4d95-8aa7-204243d0abc2	59256cc2-4482-480f-b6e5-6202f4933da4	KUNDAN	\N	\N	0.37	14	Red	\N	Emerald	Heart	\N	Invisible	\N	\N	2026-04-16 14:24:09.135	2026-04-16 14:24:09.135
d9125fc0-72bd-41e6-b2d0-1dd7f3c4bcef	59256cc2-4482-480f-b6e5-6202f4933da4	OTHER	Stone-ORD-2026-00004-2	\N	0.28	7	Yellow	SI2	Princess	Round	\N	Bezel	\N	\N	2026-04-16 14:24:09.135	2026-04-16 14:24:09.135
b57cd80f-6fe1-4f03-9130-13685ec4547c	59256cc2-4482-480f-b6e5-6202f4933da4	PEARL	Stone-ORD-2026-00004-3	\N	3.56	14	Red	\N	Oval	Trillion	\N	Bezel	\N	\N	2026-04-16 14:24:09.135	2026-04-16 14:24:09.135
a91d326e-8508-41b3-921a-2c9fcd8ac0fd	d844b6c0-f2fe-4b2b-8855-7038270d1d7e	SEMI_PRECIOUS	Stone-ORD-2026-00005-1	\N	4.34	10	White	\N	Brilliant	Triangle	\N	Flush	\N	Natural certified stones. Handle with care.	2026-04-01 14:24:09.135	2026-04-01 14:24:09.135
75d67b2e-c400-432f-8c24-2dd6c059a80f	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	CZ	Stone-ORD-2026-00006-1	\N	3.64	20	Blue	VVS2	Princess	Baguette	\N	Flush	\N	Natural certified stones. Handle with care.	2026-02-24 14:24:09.136	2026-02-24 14:24:09.136
6cd866a9-803a-4539-be2a-e14f03313cf9	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	AMERICAN_DIAMOND	\N	\N	1.4	8	Green	\N	Princess	Heart	\N	Bezel	\N	\N	2026-02-24 14:24:09.136	2026-02-24 14:24:09.136
4302bbbc-9948-452f-9b88-bf22dffdc64f	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	POLKI	Stone-ORD-2026-00006-3	\N	3.67	1	Pink	\N	Cushion	Triangle	\N	Tension	\N	\N	2026-02-24 14:24:09.136	2026-02-24 14:24:09.136
35d8001d-5184-43fe-a5d1-f2593e8be6df	ca256b8d-6ca9-4fb1-a80b-b44fe1085e34	EMERALD	\N	\N	4	12	Red	VVS2	Cushion	Triangle	\N	Invisible	\N	\N	2026-02-24 14:24:09.136	2026-02-24 14:24:09.136
59313725-4b50-4c39-83bb-0f2fc62c0a50	dd7d0803-97f1-4427-8db7-e3eec358abc0	SEMI_PRECIOUS	Stone-ORD-2026-00007-1	\N	1.13	18	White	\N	Emerald	Baguette	\N	Channel	\N	\N	2026-04-19 14:24:09.137	2026-04-19 14:24:09.137
5e8c1c34-493e-47ca-afa0-48f493d05a45	dd7d0803-97f1-4427-8db7-e3eec358abc0	AMERICAN_DIAMOND	Stone-ORD-2026-00007-2	\N	4.02	12	Green	VS2	Brilliant	Triangle	\N	Tension	\N	Natural certified stones. Handle with care.	2026-04-19 14:24:09.137	2026-04-19 14:24:09.137
6f2089b9-d2fe-4d63-9f1a-702e574eba85	dd7d0803-97f1-4427-8db7-e3eec358abc0	SAPPHIRE	\N	\N	3.68	5	Multi	\N	Cushion	Trillion	\N	Flush	\N	\N	2026-04-19 14:24:09.137	2026-04-19 14:24:09.137
1e879d00-1d75-455d-80b5-4c652b6797ea	dd7d0803-97f1-4427-8db7-e3eec358abc0	RUBY	Stone-ORD-2026-00007-4	\N	2.3	15	Blue	\N	Marquise	Round	\N	Prong	\N	\N	2026-04-19 14:24:09.137	2026-04-19 14:24:09.137
2c8d6a3f-e130-476f-98d1-008ed36f954d	02024325-af09-4cb9-9a43-8f789c688190	RUBY	Stone-ORD-2026-00009-1	\N	1.54	20	Colorless	\N	Princess	Baguette	\N	Bezel	\N	Natural certified stones. Handle with care.	2026-04-22 14:24:09.138	2026-04-22 14:24:09.138
abc55534-4b3e-4df7-a1ca-03f5cae03a42	c696664a-7260-49bb-9927-94845b4c8210	POLKI	Stone-ORD-2026-00010-1	\N	3.82	13	Multi	VS2	Cushion	Oval	\N	Invisible	\N	\N	2026-04-05 14:24:09.138	2026-04-05 14:24:09.138
3fa09170-ffb6-4939-b477-4684ce1ffc3f	c696664a-7260-49bb-9927-94845b4c8210	SAPPHIRE	Stone-ORD-2026-00010-2	\N	3.77	11	Yellow	\N	Princess	Triangle	\N	Bezel	\N	Natural certified stones. Handle with care.	2026-04-05 14:24:09.138	2026-04-05 14:24:09.138
4321df2b-eb9d-4a52-952e-73d9f3c5c559	7eac58f2-9991-49b4-9516-0cc9852308ad	SAPPHIRE	Stone-ORD-2026-00011-1	\N	3.52	1	Red	VS2	Brilliant	Oval	\N	Channel	\N	Natural certified stones. Handle with care.	2026-03-23 14:24:09.138	2026-03-23 14:24:09.138
effd2413-1cf3-4127-91cc-70ab747a371a	7eac58f2-9991-49b4-9516-0cc9852308ad	PEARL	\N	\N	2.07	12	White	VVS1	Oval	Triangle	\N	Tension	\N	\N	2026-03-23 14:24:09.138	2026-03-23 14:24:09.138
f9e26727-2a02-47f1-95d3-4eaf4c74947c	7eac58f2-9991-49b4-9516-0cc9852308ad	DIAMOND	Stone-ORD-2026-00011-3	\N	2.67	20	Multi	VVS2	Brilliant	Heart	\N	Pave	\N	\N	2026-03-23 14:24:09.138	2026-03-23 14:24:09.138
93279dc0-640c-4e0b-a72e-fcd1f729f39d	e0cb851e-66de-410f-b4cd-5e746bddb073	EMERALD	\N	\N	0.63	13	Red	\N	Rose	Square	\N	Bezel	\N	\N	2026-02-22 14:24:09.139	2026-02-22 14:24:09.139
a2eaf371-e99a-41d0-ae58-109950c14a75	431cadcb-229a-4180-bd78-794b8782d664	EMERALD	\N	\N	2.07	14	Blue	\N	Oval	Heart	\N	Tension	\N	\N	2026-02-21 14:24:09.14	2026-02-21 14:24:09.14
105ad7e8-f156-4e1a-b5c8-17a7104af981	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	SAPPHIRE	\N	\N	2.74	18	Colorless	VS2	Princess	Trillion	\N	Bezel	\N	\N	2026-04-11 14:24:09.14	2026-04-11 14:24:09.14
5aab84b6-9942-4fb6-bca2-1e11dba550bc	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	DIAMOND	\N	\N	4.16	19	Pink	\N	Princess	Baguette	\N	Prong	\N	\N	2026-04-11 14:24:09.14	2026-04-11 14:24:09.14
e3f22479-8fb6-48bf-930d-3aedda94f087	3f4dd783-30cd-4ef6-8647-38d7f4d4629f	RUBY	\N	\N	1.38	8	Colorless	\N	Cushion	Trillion	\N	Pave	\N	\N	2026-04-11 14:24:09.14	2026-04-11 14:24:09.14
fd63978d-866c-4994-b964-2a21741ee703	b34bee3d-8f21-49ec-bf32-821788a16654	SEMI_PRECIOUS	Stone-ORD-2026-00015-1	\N	3.12	19	Colorless	\N	Pear	Square	\N	Pave	\N	\N	2026-03-13 14:24:09.141	2026-03-13 14:24:09.141
f943b8a6-a975-4db6-9ebc-4c9070e43c0d	9f3c64f4-00fa-49de-9ca8-25d913cc7bee	POLKI	Stone-ORD-2026-00018-1	\N	2.61	10	Red	SI1	Cushion	Oval	\N	Pave	\N	\N	2026-03-05 14:24:09.142	2026-03-05 14:24:09.142
b7ae678c-fa90-4e31-892b-4ef75b3e0982	e605ca71-ef38-44f9-acb5-780359019180	SAPPHIRE	\N	\N	3.74	13	Green	\N	Marquise	Oval	\N	Prong	\N	\N	2026-04-03 14:24:09.142	2026-04-03 14:24:09.142
da7296d8-32ab-4c3b-bca8-534396638315	e605ca71-ef38-44f9-acb5-780359019180	RUBY	Stone-ORD-2026-00019-2	\N	4.57	8	Yellow	\N	Brilliant	Triangle	\N	Channel	\N	Natural certified stones. Handle with care.	2026-04-03 14:24:09.142	2026-04-03 14:24:09.142
34fca971-d6bf-4e1b-acb2-ed7afaf404d0	e605ca71-ef38-44f9-acb5-780359019180	CZ	\N	\N	1.84	9	Green	\N	Emerald	Triangle	\N	Bezel	\N	\N	2026-04-03 14:24:09.142	2026-04-03 14:24:09.142
417b35a9-6d3f-407b-857a-47d92d038412	e605ca71-ef38-44f9-acb5-780359019180	RUBY	Stone-ORD-2026-00019-4	\N	2.18	8	Red	\N	Brilliant	Round	\N	Invisible	\N	\N	2026-04-03 14:24:09.142	2026-04-03 14:24:09.142
c2f214f1-c4e1-4af4-8860-56b9766ed4c3	7a1fb003-1db5-45b8-9e84-aa6a65a22053	CZ	Stone-ORD-2026-00020-1	\N	0.68	6	Yellow	SI1	Cushion	Oval	\N	Flush	\N	\N	2026-03-22 14:24:09.143	2026-03-22 14:24:09.143
87b853d8-3a51-4514-abda-e81103ebe368	7a1fb003-1db5-45b8-9e84-aa6a65a22053	SAPPHIRE	\N	\N	4.98	11	White	\N	Princess	Triangle	\N	Bezel	\N	\N	2026-03-22 14:24:09.143	2026-03-22 14:24:09.143
e9beffa2-c71f-442c-a2ed-aceba4ce0b2d	7a1fb003-1db5-45b8-9e84-aa6a65a22053	PEARL	Stone-ORD-2026-00020-3	\N	3.35	2	Colorless	\N	Oval	Trillion	\N	Channel	\N	Natural certified stones. Handle with care.	2026-03-22 14:24:09.143	2026-03-22 14:24:09.143
8a0571f5-b54f-41f4-984e-06a87062f5ec	7a1fb003-1db5-45b8-9e84-aa6a65a22053	PEARL	Stone-ORD-2026-00020-4	\N	3.72	12	Colorless	VS2	Cushion	Heart	\N	Tension	\N	\N	2026-03-22 14:24:09.143	2026-03-22 14:24:09.143
f56494b0-31f7-475b-93b1-dcdb63025e24	474dbdc7-7c13-448e-988b-9afa51226b63	DIAMOND	\N	\N	0.23	1	EF	VVS2	POOR	CUSHION	\N	INVISIBLE	\N	\N	2026-04-27 20:57:44.921	2026-04-27 20:57:44.921
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, department, phone, avatar, "isActive", "lastLoginAt", "availabilityStatus", "lastAssignedAt", "createdAt", "updatedAt") FROM stdin;
dd6a3eda-6cbd-406f-a2c4-b5427b6edf40	Priya Pandey	priya.pandey@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	OFFICE_STAFF	\N	+91 7894466117	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
b73a96b8-dde4-47a6-b8ea-eb47fdbfbae9	Meera Sharma	meera.sharma@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	ADMIN	\N	+91 8669656889	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
6c30adce-e6e1-4721-b505-08d6591f7eba	Sonali Sharma	sonali.sharma@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	OFFICE_STAFF	\N	+91 8766501990	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
ce4f8b64-ada8-443c-815a-e2dd93312bf6	Divya Rao	divya.rao@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	OFFICE_STAFF	\N	+91 8502929107	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
549359df-dc72-4a9c-be54-7f630177ec39	Priya Gupta	priya.gupta@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	CAD	+91 8332890986	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
8765c0ba-93fa-4f39-b09b-18bb9228b4e6	Suresh Mehta	suresh.mehta@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	FACTORY_MANAGER	\N	+91 9875801526	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
e0ac9b4b-d403-43a2-b31e-090c288fad4e	Ashok Dubey	ashok.dubey@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	CASTING	+91 8439644339	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
67a0c0c5-b392-4a51-babc-a7414447fc70	Ravi Srivastava	ravi.srivastava@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	CAD	+91 8165509829	\N	f	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
8e91f0bf-2795-46ec-a1bf-18dd8f60da19	Rajiv Kapoor	rajiv.kapoor@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	ADMIN	\N	+91 8404838325	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
6fc2785a-11d0-474f-9e8d-bfe6bb3d5c75	Ashok Kumar	ashok.kumar@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	OFFICE_STAFF	\N	+91 7774829876	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
d0116fa0-e98c-4483-a7a7-9065d3a3f062	Ritu Patel	ritu.patel@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	PRINT	+91 8885595835	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
2a905102-2728-452b-95a7-0e088a8ed5b2	Siddharth Shah	siddharth.shah@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	MEENA	+91 7906104477	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
0f5c6a35-7b07-40bd-ae0e-4972d83689c4	Arjun Malhotra	arjun.malhotra@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	POLISH_2	+91 7392325888	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
717f02ad-f912-4fa4-9948-e2cc41feca86	Pooja Verma	pooja.verma@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	SETTING	+91 7448858323	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
bfc4ace0-d29c-4544-9439-6363ccad6179	Ravi Malhotra	ravi.malhotra@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	FILLING	+91 7800760026	\N	f	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
233aacac-cb6b-4fc2-940f-336e3ddc1fe9	Harish Patel	harish.patel@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	FACTORY_MANAGER	\N	+91 8216580371	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
c87ee2e5-339d-46ef-9bca-eec6a1386ad4	Dinesh Shah	dinesh.shah@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	FACTORY_MANAGER	\N	+91 8461161528	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
e323b9f7-6e3f-4e3f-b959-2ecf85810b54	Geeta Kapoor	geeta.kapoor@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	CASTING	+91 9926635613	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
bd61c429-75d0-4877-ab03-48ed74063952	Sunil Pillai	sunil.pillai@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	DEPARTMENT_WORKER	POLISH_1	+91 7325783704	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
0e95fb6e-c79a-4d07-9276-71b6dca69cb4	Deepika Reddy	deepika.reddy@goldfactory.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	OFFICE_STAFF	\N	+91 7083159713	\N	t	\N	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-22 14:24:09.072
9c5a46c5-1a87-4bd1-82d7-da3383cdb612	Sidharth P Jain	ativa.web.it@gmail.com	$2a$12$MIYjQy.ssrnn9bP764iPTuUCq.phdSe0mBhelFMkPWTpnpBW9HJ16	ADMIN	\N	+91 9964599000	\N	t	2026-04-29 03:57:37.637	AVAILABLE	\N	2026-04-22 14:24:09.072	2026-04-29 03:57:37.638
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, name, unique_code, phone, gst_number, gst_details, address, created_at, updated_at, credit_balance) FROM stdin;
4868cdf8-330e-4889-9ed8-a2e544ca60d3	Bullion	VEN-001	9964599000	\N	\N	\N	2026-04-22 19:02:39.096	2026-04-24 12:59:34.045	0
166d72c1-70b5-4105-bcfe-8060e6dc062b	guru hasti	VEN-002	9964533000	\N	\N	\N	2026-04-24 15:04:36.855	2026-04-24 15:04:36.855	0
e685cd40-774b-4d9c-a8a2-f491de5aa317	sidharth	VEN-003	9964599000	\N	\N	\N	2026-04-24 15:10:11.919	2026-04-24 15:10:11.919	0
7f7dddf8-7d3e-4854-bf21-d5eca75ae01b	ativa	VEN-004	9003506506	\N	\N	\N	2026-04-24 15:13:04.95	2026-04-24 15:13:04.95	0
6e3ae63a-e5d3-4962-b3ee-aee2f8641631	ativa rtgs	VEN-005	9606546546	29AWSPJ4532A1ZI	{"pan": "AWSPJ4532A", "gstin": "29AWSPJ4532A1ZI", "state": "Karnataka", "source": "parsed", "status": null, "address": null, "legalName": null, "stateCode": "29", "tradeName": null, "entityNumber": "1", "registrationDate": null}	560008	2026-04-24 15:14:25.089	2026-04-24 15:16:57.753	61100
502856df-781f-42c6-a3dd-ce8afcc8e2a0	Reliance Jio Infocomm Limited	VEN-006	8105555762	27AABCI6363G3ZH	{"pan": "AABCI6363G", "city": "Pune", "gstin": "27AABCI6363G3ZH", "state": "Maharashtra", "source": "rapidapi-tool", "status": "Active", "address": "WEST END MALL - II, S.No.169/1, Sector - II, 2ND FLOOR, H.No.1 Village Aundh, Tal.Haveli, Pune, Maharashtra, 411007", "pincode": "411007", "taxType": "Input Service Distributor (ISD)", "legalName": "Reliance Jio Infocomm Limited", "stateCode": "27", "tradeName": "Reliance Jio Infocomm Limited", "addressParts": {"street": "H.No.1 Village Aundh", "pincode": "411007", "district": "Pune", "locality": "Tal.Haveli", "location": "Tal.Haveli", "stateCode": "Maharashtra", "floorNumber": "2ND FLOOR", "buildingName": "S.No.169/1, Sector - II", "buildingNumber": "WEST END MALL - II"}, "businessType": "Public Limited Company", "entityNumber": "3", "cancelledDate": null, "eInvoiceStatus": null, "lastUpdateDate": null, "registrationDate": "14/07/2017", "stateJurisdiction": "AUNDH_701", "centerJurisdiction": "RANGE-VI", "natureOfBusinessActivity": ["Recipient of Goods or Services"]}	WEST END MALL - II, S.No.169/1, Sector - II, 2ND FLOOR, H.No.1 Village Aundh, Tal.Haveli, Pune, Maharashtra, 411007	2026-04-26 12:35:16.028	2026-04-26 12:35:16.028	0
4c7f34f0-bb69-4aea-aa4e-acadcd737de4	PRABHANTH ENTERPRISES LLP	VEN-007	8105555762	29ABEFP3023B1ZO	{"pan": "ABEFP3023B", "city": "Bengaluru Urban", "gstin": "29ABEFP3023B1ZO", "state": "Karnataka", "source": "rapidapi-tool", "status": "Active", "address": "36, Vibha, Ground Floor, Middle School Road, Bengaluru, Bengaluru Urban, Karnataka, 560004", "pincode": "560004", "taxType": "Regular", "legalName": "PRABHANTH ENTERPRISES LLP", "stateCode": "29", "tradeName": "PRABHANTH ENTERPRISES LLP", "addressParts": {"street": "Middle School Road", "pincode": "560004", "district": "Bengaluru Urban", "locality": "Bengaluru", "location": "Bengaluru", "stateCode": "Karnataka", "floorNumber": "Ground Floor", "buildingName": "Vibha", "buildingNumber": "36"}, "businessType": "Limited Liability Partnership", "entityNumber": "1", "cancelledDate": null, "eInvoiceStatus": null, "lastUpdateDate": null, "registrationDate": "14/11/2023", "stateJurisdiction": "LGSTO 100 - Bengaluru", "centerJurisdiction": "RANGE-CSD3", "natureOfBusinessActivity": ["Office / Sale Office"]}	36, Vibha, Ground Floor, Middle School Road, Bengaluru, Bengaluru Urban, Karnataka, 560004	2026-04-26 12:40:47.855	2026-04-26 12:40:47.855	0
24da4105-5631-464d-9ca0-176fa5262063	YD	VEN-008	+91 9108844113	\N	{"pan": null, "city": "Bangalore", "gstin": "", "state": "Karnataka", "source": "manual", "status": null, "address": null, "pincode": "560002", "taxType": null, "legalName": "Yash Dhona", "stateCode": "29", "tradeName": "Star Gold Bullion", "addressParts": null, "businessType": null, "entityNumber": null, "cancelledDate": null, "eInvoiceStatus": null, "lastUpdateDate": null, "registrationDate": null, "stateJurisdiction": null, "centerJurisdiction": null, "natureOfBusinessActivity": null}	Cubbonpete, Bangalore - 560002.	2026-04-27 20:23:44.305	2026-04-27 20:23:44.305	0
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: department_tracking department_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_tracking
    ADD CONSTRAINT department_tracking_pkey PRIMARY KEY (id);


--
-- Name: department_work_data department_work_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_work_data
    ADD CONSTRAINT department_work_data_pkey PRIMARY KEY (id);


--
-- Name: diamond_lots diamond_lots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_lots
    ADD CONSTRAINT diamond_lots_pkey PRIMARY KEY (id);


--
-- Name: diamond_payments diamond_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_payments
    ADD CONSTRAINT diamond_payments_pkey PRIMARY KEY (id);


--
-- Name: diamond_rates diamond_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_rates
    ADD CONSTRAINT diamond_rates_pkey PRIMARY KEY (id);


--
-- Name: diamond_transactions diamond_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_transactions
    ADD CONSTRAINT diamond_transactions_pkey PRIMARY KEY (id);


--
-- Name: diamonds diamonds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamonds
    ADD CONSTRAINT diamonds_pkey PRIMARY KEY (id);


--
-- Name: employee_advances employee_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_advances
    ADD CONSTRAINT employee_advances_pkey PRIMARY KEY (id);


--
-- Name: employee_loans employee_loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_loans
    ADD CONSTRAINT employee_loans_pkey PRIMARY KEY (id);


--
-- Name: employee_shifts employee_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_shifts
    ADD CONSTRAINT employee_shifts_pkey PRIMARY KEY (id);


--
-- Name: equipment_maintenance equipment_maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_maintenance
    ADD CONSTRAINT equipment_maintenance_pkey PRIMARY KEY (id);


--
-- Name: factory_item_categories factory_item_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_item_categories
    ADD CONSTRAINT factory_item_categories_pkey PRIMARY KEY (id);


--
-- Name: factory_item_transactions factory_item_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_item_transactions
    ADD CONSTRAINT factory_item_transactions_pkey PRIMARY KEY (id);


--
-- Name: factory_items factory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_items
    ADD CONSTRAINT factory_items_pkey PRIMARY KEY (id);


--
-- Name: feature_modules feature_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_modules
    ADD CONSTRAINT feature_modules_pkey PRIMARY KEY (id);


--
-- Name: feature_permissions feature_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_permissions
    ADD CONSTRAINT feature_permissions_pkey PRIMARY KEY (id);


--
-- Name: final_submissions final_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_submissions
    ADD CONSTRAINT final_submissions_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);


--
-- Name: melting_batches melting_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.melting_batches
    ADD CONSTRAINT melting_batches_pkey PRIMARY KEY (id);


--
-- Name: metal_payments metal_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_payments
    ADD CONSTRAINT metal_payments_pkey PRIMARY KEY (id);


--
-- Name: metal_rates metal_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_rates
    ADD CONSTRAINT metal_rates_pkey PRIMARY KEY (id);


--
-- Name: metal_stock metal_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_stock
    ADD CONSTRAINT metal_stock_pkey PRIMARY KEY (id);


--
-- Name: metal_transactions metal_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_transactions
    ADD CONSTRAINT metal_transactions_pkey PRIMARY KEY (id);


--
-- Name: notification_queue notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_activities order_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_activities
    ADD CONSTRAINT order_activities_pkey PRIMARY KEY (id);


--
-- Name: order_comments order_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_comments
    ADD CONSTRAINT order_comments_pkey PRIMARY KEY (id);


--
-- Name: order_details order_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: real_stone_payments real_stone_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_payments
    ADD CONSTRAINT real_stone_payments_pkey PRIMARY KEY (id);


--
-- Name: real_stone_rates real_stone_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_rates
    ADD CONSTRAINT real_stone_rates_pkey PRIMARY KEY (id);


--
-- Name: real_stone_transactions real_stone_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_transactions
    ADD CONSTRAINT real_stone_transactions_pkey PRIMARY KEY (id);


--
-- Name: real_stones real_stones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stones
    ADD CONSTRAINT real_stones_pkey PRIMARY KEY (id);


--
-- Name: salary_structures salary_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: specification_templates specification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specification_templates
    ADD CONSTRAINT specification_templates_pkey PRIMARY KEY (id);


--
-- Name: stone_packet_payments stone_packet_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_payments
    ADD CONSTRAINT stone_packet_payments_pkey PRIMARY KEY (id);


--
-- Name: stone_packet_transactions stone_packet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_transactions
    ADD CONSTRAINT stone_packet_transactions_pkey PRIMARY KEY (id);


--
-- Name: stone_packets stone_packets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packets
    ADD CONSTRAINT stone_packets_pkey PRIMARY KEY (id);


--
-- Name: stones stones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stones
    ADD CONSTRAINT stones_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: attendance_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attendance_date_idx ON public.attendance USING btree (date);


--
-- Name: attendance_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attendance_status_idx ON public.attendance USING btree (status);


--
-- Name: attendance_user_id_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attendance_user_id_date_idx ON public.attendance USING btree (user_id, date);


--
-- Name: attendance_user_id_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX attendance_user_id_date_key ON public.attendance USING btree (user_id, date);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt" DESC);


--
-- Name: audit_logs_entityType_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_entityType_createdAt_idx" ON public.audit_logs USING btree ("entityType", "createdAt" DESC);


--
-- Name: audit_logs_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_entityType_entityId_idx" ON public.audit_logs USING btree ("entityType", "entityId");


--
-- Name: audit_logs_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_userId_createdAt_idx" ON public.audit_logs USING btree ("userId", "createdAt" DESC);


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_userId_idx" ON public.audit_logs USING btree ("userId");


--
-- Name: clients_approval_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_approval_status_idx ON public.clients USING btree (approval_status);


--
-- Name: clients_business_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_business_name_idx ON public.clients USING btree (business_name);


--
-- Name: clients_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clients_user_id_key ON public.clients USING btree (user_id);


--
-- Name: department_tracking_assignedToId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_assignedToId_idx" ON public.department_tracking USING btree ("assignedToId");


--
-- Name: department_tracking_assignedToId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_assignedToId_status_idx" ON public.department_tracking USING btree ("assignedToId", status);


--
-- Name: department_tracking_completedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_completedAt_idx" ON public.department_tracking USING btree ("completedAt");


--
-- Name: department_tracking_departmentName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_departmentName_idx" ON public.department_tracking USING btree ("departmentName");


--
-- Name: department_tracking_departmentName_queuePosition_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_departmentName_queuePosition_idx" ON public.department_tracking USING btree ("departmentName", "queuePosition");


--
-- Name: department_tracking_departmentName_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_departmentName_status_idx" ON public.department_tracking USING btree ("departmentName", status);


--
-- Name: department_tracking_orderId_departmentName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "department_tracking_orderId_departmentName_key" ON public.department_tracking USING btree ("orderId", "departmentName");


--
-- Name: department_tracking_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_orderId_idx" ON public.department_tracking USING btree ("orderId");


--
-- Name: department_tracking_queuePosition_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_queuePosition_idx" ON public.department_tracking USING btree ("queuePosition");


--
-- Name: department_tracking_startedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_startedAt_idx" ON public.department_tracking USING btree ("startedAt");


--
-- Name: department_tracking_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX department_tracking_status_idx ON public.department_tracking USING btree (status);


--
-- Name: department_tracking_status_startedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_tracking_status_startedAt_idx" ON public.department_tracking USING btree (status, "startedAt");


--
-- Name: department_work_data_departmentTrackingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_work_data_departmentTrackingId_idx" ON public.department_work_data USING btree ("departmentTrackingId");


--
-- Name: department_work_data_departmentTrackingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "department_work_data_departmentTrackingId_key" ON public.department_work_data USING btree ("departmentTrackingId");


--
-- Name: department_work_data_isComplete_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_work_data_isComplete_idx" ON public.department_work_data USING btree ("isComplete");


--
-- Name: department_work_data_isDraft_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_work_data_isDraft_idx" ON public.department_work_data USING btree ("isDraft");


--
-- Name: department_work_data_workCompletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "department_work_data_workCompletedAt_idx" ON public.department_work_data USING btree ("workCompletedAt");


--
-- Name: diamond_lots_lot_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_lots_lot_number_idx ON public.diamond_lots USING btree (lot_number);


--
-- Name: diamond_lots_lot_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX diamond_lots_lot_number_key ON public.diamond_lots USING btree (lot_number);


--
-- Name: diamond_payments_recorded_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_payments_recorded_at_idx ON public.diamond_payments USING btree (recorded_at);


--
-- Name: diamond_payments_transaction_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_payments_transaction_id_idx ON public.diamond_payments USING btree (transaction_id);


--
-- Name: diamond_rates_effective_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_rates_effective_date_idx ON public.diamond_rates USING btree (effective_date);


--
-- Name: diamond_rates_shape_color_clarity_effective_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_rates_shape_color_clarity_effective_date_idx ON public.diamond_rates USING btree (shape, color, clarity, effective_date);


--
-- Name: diamond_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_transactions_created_at_idx ON public.diamond_transactions USING btree (created_at);


--
-- Name: diamond_transactions_diamond_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_transactions_diamond_id_idx ON public.diamond_transactions USING btree (diamond_id);


--
-- Name: diamond_transactions_is_billable_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_transactions_is_billable_idx ON public.diamond_transactions USING btree (is_billable);


--
-- Name: diamond_transactions_payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_transactions_payment_status_idx ON public.diamond_transactions USING btree (payment_status);


--
-- Name: diamond_transactions_transaction_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_transactions_transaction_type_idx ON public.diamond_transactions USING btree (transaction_type);


--
-- Name: diamond_transactions_vendor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamond_transactions_vendor_id_idx ON public.diamond_transactions USING btree (vendor_id);


--
-- Name: diamonds_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamonds_category_idx ON public.diamonds USING btree (category);


--
-- Name: diamonds_shape_color_clarity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamonds_shape_color_clarity_idx ON public.diamonds USING btree (shape, color, clarity);


--
-- Name: diamonds_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamonds_status_idx ON public.diamonds USING btree (status);


--
-- Name: diamonds_stock_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX diamonds_stock_number_idx ON public.diamonds USING btree (stock_number);


--
-- Name: diamonds_stock_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX diamonds_stock_number_key ON public.diamonds USING btree (stock_number);


--
-- Name: employee_advances_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employee_advances_status_idx ON public.employee_advances USING btree (status);


--
-- Name: employee_advances_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employee_advances_user_id_idx ON public.employee_advances USING btree (user_id);


--
-- Name: employee_loans_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employee_loans_status_idx ON public.employee_loans USING btree (status);


--
-- Name: employee_loans_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employee_loans_user_id_idx ON public.employee_loans USING btree (user_id);


--
-- Name: employee_shifts_effective_from_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employee_shifts_effective_from_idx ON public.employee_shifts USING btree (effective_from);


--
-- Name: employee_shifts_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employee_shifts_user_id_idx ON public.employee_shifts USING btree (user_id);


--
-- Name: equipment_maintenance_equipment_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_maintenance_equipment_id_idx ON public.equipment_maintenance USING btree (equipment_id);


--
-- Name: equipment_maintenance_performed_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX equipment_maintenance_performed_at_idx ON public.equipment_maintenance USING btree (performed_at);


--
-- Name: factory_item_categories_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX factory_item_categories_name_idx ON public.factory_item_categories USING btree (name);


--
-- Name: factory_item_categories_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX factory_item_categories_name_key ON public.factory_item_categories USING btree (name);


--
-- Name: factory_item_categories_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX factory_item_categories_parent_id_idx ON public.factory_item_categories USING btree (parent_id);


--
-- Name: factory_item_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX factory_item_transactions_created_at_idx ON public.factory_item_transactions USING btree (created_at);


--
-- Name: factory_item_transactions_item_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX factory_item_transactions_item_id_idx ON public.factory_item_transactions USING btree (item_id);


--
-- Name: factory_items_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX factory_items_category_id_idx ON public.factory_items USING btree (category_id);


--
-- Name: factory_items_is_equipment_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX factory_items_is_equipment_idx ON public.factory_items USING btree (is_equipment);


--
-- Name: factory_items_item_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX factory_items_item_code_idx ON public.factory_items USING btree (item_code);


--
-- Name: factory_items_item_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX factory_items_item_code_key ON public.factory_items USING btree (item_code);


--
-- Name: feature_modules_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX feature_modules_name_key ON public.feature_modules USING btree (name);


--
-- Name: feature_permissions_feature_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feature_permissions_feature_id_idx ON public.feature_permissions USING btree (feature_id);


--
-- Name: feature_permissions_feature_id_role_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX feature_permissions_feature_id_role_key ON public.feature_permissions USING btree (feature_id, role);


--
-- Name: feature_permissions_feature_id_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX feature_permissions_feature_id_user_id_key ON public.feature_permissions USING btree (feature_id, user_id);


--
-- Name: feature_permissions_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feature_permissions_role_idx ON public.feature_permissions USING btree (role);


--
-- Name: feature_permissions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feature_permissions_user_id_idx ON public.feature_permissions USING btree (user_id);


--
-- Name: final_submissions_customerApproved_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "final_submissions_customerApproved_idx" ON public.final_submissions USING btree ("customerApproved");


--
-- Name: final_submissions_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "final_submissions_orderId_idx" ON public.final_submissions USING btree ("orderId");


--
-- Name: final_submissions_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "final_submissions_orderId_key" ON public.final_submissions USING btree ("orderId");


--
-- Name: final_submissions_qualityGrade_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "final_submissions_qualityGrade_idx" ON public.final_submissions USING btree ("qualityGrade");


--
-- Name: final_submissions_submittedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "final_submissions_submittedAt_idx" ON public.final_submissions USING btree ("submittedAt" DESC);


--
-- Name: final_submissions_submittedById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "final_submissions_submittedById_idx" ON public.final_submissions USING btree ("submittedById");


--
-- Name: final_submissions_submittedById_submittedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "final_submissions_submittedById_submittedAt_idx" ON public.final_submissions USING btree ("submittedById", "submittedAt" DESC);


--
-- Name: holidays_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX holidays_date_idx ON public.holidays USING btree (date);


--
-- Name: leaves_start_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leaves_start_date_idx ON public.leaves USING btree (start_date);


--
-- Name: leaves_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leaves_status_idx ON public.leaves USING btree (status);


--
-- Name: leaves_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leaves_user_id_idx ON public.leaves USING btree (user_id);


--
-- Name: melting_batches_batch_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX melting_batches_batch_number_idx ON public.melting_batches USING btree (batch_number);


--
-- Name: melting_batches_batch_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX melting_batches_batch_number_key ON public.melting_batches USING btree (batch_number);


--
-- Name: melting_batches_melted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX melting_batches_melted_at_idx ON public.melting_batches USING btree (melted_at);


--
-- Name: metal_payments_recorded_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_payments_recorded_at_idx ON public.metal_payments USING btree (recorded_at);


--
-- Name: metal_payments_transaction_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_payments_transaction_id_idx ON public.metal_payments USING btree (transaction_id);


--
-- Name: metal_rates_effective_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_rates_effective_date_idx ON public.metal_rates USING btree (effective_date);


--
-- Name: metal_rates_metal_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_rates_metal_type_idx ON public.metal_rates USING btree (metal_type);


--
-- Name: metal_rates_metal_type_purity_effective_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_rates_metal_type_purity_effective_date_idx ON public.metal_rates USING btree (metal_type, purity, effective_date);


--
-- Name: metal_stock_form_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_stock_form_idx ON public.metal_stock USING btree (form);


--
-- Name: metal_stock_metal_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_stock_metal_type_idx ON public.metal_stock USING btree (metal_type);


--
-- Name: metal_stock_metal_type_purity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_stock_metal_type_purity_idx ON public.metal_stock USING btree (metal_type, purity);


--
-- Name: metal_stock_purity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_stock_purity_idx ON public.metal_stock USING btree (purity);


--
-- Name: metal_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_transactions_created_at_idx ON public.metal_transactions USING btree (created_at);


--
-- Name: metal_transactions_is_billable_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_transactions_is_billable_idx ON public.metal_transactions USING btree (is_billable);


--
-- Name: metal_transactions_metal_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_transactions_metal_type_idx ON public.metal_transactions USING btree (metal_type);


--
-- Name: metal_transactions_metal_type_transaction_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_transactions_metal_type_transaction_type_idx ON public.metal_transactions USING btree (metal_type, transaction_type);


--
-- Name: metal_transactions_payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_transactions_payment_status_idx ON public.metal_transactions USING btree (payment_status);


--
-- Name: metal_transactions_transaction_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_transactions_transaction_type_idx ON public.metal_transactions USING btree (transaction_type);


--
-- Name: metal_transactions_vendor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX metal_transactions_vendor_id_idx ON public.metal_transactions USING btree (vendor_id);


--
-- Name: notification_queue_recipient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_queue_recipient_id_idx ON public.notification_queue USING btree (recipient_id);


--
-- Name: notification_queue_scheduled_for_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_queue_scheduled_for_idx ON public.notification_queue USING btree (scheduled_for);


--
-- Name: notification_queue_status_channel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_queue_status_channel_idx ON public.notification_queue USING btree (status, channel);


--
-- Name: notifications_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_createdAt_idx" ON public.notifications USING btree ("createdAt" DESC);


--
-- Name: notifications_isRead_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_isRead_idx" ON public.notifications USING btree ("isRead");


--
-- Name: notifications_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_orderId_idx" ON public.notifications USING btree ("orderId");


--
-- Name: notifications_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_priority_idx ON public.notifications USING btree (priority);


--
-- Name: notifications_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_type_idx ON public.notifications USING btree (type);


--
-- Name: notifications_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_createdAt_idx" ON public.notifications USING btree ("userId", "createdAt" DESC);


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: notifications_userId_isRead_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_isRead_idx" ON public.notifications USING btree ("userId", "isRead");


--
-- Name: order_activities_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_activities_action_idx ON public.order_activities USING btree (action);


--
-- Name: order_activities_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_activities_createdAt_idx" ON public.order_activities USING btree ("createdAt" DESC);


--
-- Name: order_activities_orderId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_activities_orderId_createdAt_idx" ON public.order_activities USING btree ("orderId", "createdAt" DESC);


--
-- Name: order_activities_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_activities_orderId_idx" ON public.order_activities USING btree ("orderId");


--
-- Name: order_activities_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_activities_userId_idx" ON public.order_activities USING btree ("userId");


--
-- Name: order_comments_order_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_comments_order_id_created_at_idx ON public.order_comments USING btree (order_id, created_at);


--
-- Name: order_comments_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_comments_user_id_idx ON public.order_comments USING btree (user_id);


--
-- Name: order_details_dueDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_details_dueDate_idx" ON public.order_details USING btree ("dueDate");


--
-- Name: order_details_enteredById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_details_enteredById_idx" ON public.order_details USING btree ("enteredById");


--
-- Name: order_details_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_details_orderId_idx" ON public.order_details USING btree ("orderId");


--
-- Name: order_details_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "order_details_orderId_key" ON public.order_details USING btree ("orderId");


--
-- Name: order_details_productType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "order_details_productType_idx" ON public.order_details USING btree ("productType");


--
-- Name: order_details_purity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_details_purity_idx ON public.order_details USING btree (purity);


--
-- Name: orders_completedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_completedAt_idx" ON public.orders USING btree ("completedAt");


--
-- Name: orders_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_createdAt_idx" ON public.orders USING btree ("createdAt");


--
-- Name: orders_createdById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_createdById_idx" ON public.orders USING btree ("createdById");


--
-- Name: orders_createdById_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_createdById_status_idx" ON public.orders USING btree ("createdById", status);


--
-- Name: orders_currentDepartment_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_currentDepartment_idx" ON public.orders USING btree ("currentDepartment");


--
-- Name: orders_customerName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_customerName_idx" ON public.orders USING btree ("customerName");


--
-- Name: orders_orderNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_orderNumber_idx" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_priority_idx ON public.orders USING btree (priority DESC);


--
-- Name: orders_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_status_createdAt_idx" ON public.orders USING btree (status, "createdAt" DESC);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_status_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_status_priority_idx ON public.orders USING btree (status, priority DESC);


--
-- Name: orders_updatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "orders_updatedAt_idx" ON public.orders USING btree ("updatedAt" DESC);


--
-- Name: payroll_periods_month_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payroll_periods_month_year_idx ON public.payroll_periods USING btree (month, year);


--
-- Name: payroll_periods_month_year_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payroll_periods_month_year_key ON public.payroll_periods USING btree (month, year);


--
-- Name: payroll_periods_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payroll_periods_status_idx ON public.payroll_periods USING btree (status);


--
-- Name: payslips_payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payslips_payment_status_idx ON public.payslips USING btree (payment_status);


--
-- Name: payslips_period_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payslips_period_id_idx ON public.payslips USING btree (period_id);


--
-- Name: payslips_period_id_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payslips_period_id_user_id_key ON public.payslips USING btree (period_id, user_id);


--
-- Name: payslips_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payslips_user_id_idx ON public.payslips USING btree (user_id);


--
-- Name: real_stone_payments_recorded_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stone_payments_recorded_at_idx ON public.real_stone_payments USING btree (recorded_at);


--
-- Name: real_stone_payments_transaction_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stone_payments_transaction_id_idx ON public.real_stone_payments USING btree (transaction_id);


--
-- Name: real_stone_rates_stone_type_quality_effective_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stone_rates_stone_type_quality_effective_date_idx ON public.real_stone_rates USING btree (stone_type, quality, effective_date);


--
-- Name: real_stone_transactions_is_billable_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stone_transactions_is_billable_idx ON public.real_stone_transactions USING btree (is_billable);


--
-- Name: real_stone_transactions_payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stone_transactions_payment_status_idx ON public.real_stone_transactions USING btree (payment_status);


--
-- Name: real_stone_transactions_stone_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stone_transactions_stone_id_idx ON public.real_stone_transactions USING btree (stone_id);


--
-- Name: real_stone_transactions_vendor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stone_transactions_vendor_id_idx ON public.real_stone_transactions USING btree (vendor_id);


--
-- Name: real_stones_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stones_status_idx ON public.real_stones USING btree (status);


--
-- Name: real_stones_stock_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stones_stock_number_idx ON public.real_stones USING btree (stock_number);


--
-- Name: real_stones_stock_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX real_stones_stock_number_key ON public.real_stones USING btree (stock_number);


--
-- Name: real_stones_stone_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX real_stones_stone_type_idx ON public.real_stones USING btree (stone_type);


--
-- Name: salary_structures_effective_from_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX salary_structures_effective_from_idx ON public.salary_structures USING btree (effective_from);


--
-- Name: salary_structures_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX salary_structures_user_id_idx ON public.salary_structures USING btree (user_id);


--
-- Name: shifts_is_default_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shifts_is_default_idx ON public.shifts USING btree (is_default);


--
-- Name: specification_templates_isPublic_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "specification_templates_isPublic_idx" ON public.specification_templates USING btree ("isPublic");


--
-- Name: specification_templates_productType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "specification_templates_productType_idx" ON public.specification_templates USING btree ("productType");


--
-- Name: specification_templates_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "specification_templates_userId_idx" ON public.specification_templates USING btree ("userId");


--
-- Name: stone_packet_payments_recorded_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packet_payments_recorded_at_idx ON public.stone_packet_payments USING btree (recorded_at);


--
-- Name: stone_packet_payments_transaction_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packet_payments_transaction_id_idx ON public.stone_packet_payments USING btree (transaction_id);


--
-- Name: stone_packet_transactions_is_billable_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packet_transactions_is_billable_idx ON public.stone_packet_transactions USING btree (is_billable);


--
-- Name: stone_packet_transactions_packet_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packet_transactions_packet_id_idx ON public.stone_packet_transactions USING btree (packet_id);


--
-- Name: stone_packet_transactions_payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packet_transactions_payment_status_idx ON public.stone_packet_transactions USING btree (payment_status);


--
-- Name: stone_packet_transactions_vendor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packet_transactions_vendor_id_idx ON public.stone_packet_transactions USING btree (vendor_id);


--
-- Name: stone_packets_packet_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packets_packet_number_idx ON public.stone_packets USING btree (packet_number);


--
-- Name: stone_packets_packet_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX stone_packets_packet_number_key ON public.stone_packets USING btree (packet_number);


--
-- Name: stone_packets_stone_type_size_color_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stone_packets_stone_type_size_color_idx ON public.stone_packets USING btree (stone_type, size, color);


--
-- Name: stones_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stones_orderId_idx" ON public.stones USING btree ("orderId");


--
-- Name: stones_orderId_stoneType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stones_orderId_stoneType_idx" ON public.stones USING btree ("orderId", "stoneType");


--
-- Name: stones_setting_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stones_setting_idx ON public.stones USING btree (setting);


--
-- Name: stones_shape_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stones_shape_idx ON public.stones USING btree (shape);


--
-- Name: stones_stoneType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "stones_stoneType_idx" ON public.stones USING btree ("stoneType");


--
-- Name: users_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_createdAt_idx" ON public.users USING btree ("createdAt" DESC);


--
-- Name: users_department_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_department_idx ON public.users USING btree (department);


--
-- Name: users_department_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_department_isActive_idx" ON public.users USING btree (department, "isActive");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_isActive_idx" ON public.users USING btree ("isActive");


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_role_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_role_isActive_idx" ON public.users USING btree (role, "isActive");


--
-- Name: vendors_gst_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX vendors_gst_number_idx ON public.vendors USING btree (gst_number);


--
-- Name: vendors_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX vendors_name_idx ON public.vendors USING btree (name);


--
-- Name: vendors_unique_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX vendors_unique_code_key ON public.vendors USING btree (unique_code);


--
-- Name: attendance attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: department_tracking department_tracking_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_tracking
    ADD CONSTRAINT "department_tracking_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: department_tracking department_tracking_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_tracking
    ADD CONSTRAINT "department_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: department_work_data department_work_data_departmentTrackingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_work_data
    ADD CONSTRAINT "department_work_data_departmentTrackingId_fkey" FOREIGN KEY ("departmentTrackingId") REFERENCES public.department_tracking(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: diamond_payments diamond_payments_recorded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_payments
    ADD CONSTRAINT diamond_payments_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: diamond_payments diamond_payments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_payments
    ADD CONSTRAINT diamond_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.diamond_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: diamond_rates diamond_rates_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_rates
    ADD CONSTRAINT diamond_rates_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: diamond_transactions diamond_transactions_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_transactions
    ADD CONSTRAINT diamond_transactions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: diamond_transactions diamond_transactions_diamond_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_transactions
    ADD CONSTRAINT diamond_transactions_diamond_id_fkey FOREIGN KEY (diamond_id) REFERENCES public.diamonds(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: diamond_transactions diamond_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_transactions
    ADD CONSTRAINT diamond_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diamond_transactions diamond_transactions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamond_transactions
    ADD CONSTRAINT diamond_transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diamonds diamonds_issued_to_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamonds
    ADD CONSTRAINT diamonds_issued_to_order_id_fkey FOREIGN KEY (issued_to_order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diamonds diamonds_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diamonds
    ADD CONSTRAINT diamonds_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.diamond_lots(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_advances employee_advances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_advances
    ADD CONSTRAINT employee_advances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_loans employee_loans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_loans
    ADD CONSTRAINT employee_loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_shifts employee_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_shifts
    ADD CONSTRAINT employee_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_shifts employee_shifts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_shifts
    ADD CONSTRAINT employee_shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipment_maintenance equipment_maintenance_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_maintenance
    ADD CONSTRAINT equipment_maintenance_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: equipment_maintenance equipment_maintenance_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_maintenance
    ADD CONSTRAINT equipment_maintenance_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.factory_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: factory_item_categories factory_item_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_item_categories
    ADD CONSTRAINT factory_item_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.factory_item_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: factory_item_transactions factory_item_transactions_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_item_transactions
    ADD CONSTRAINT factory_item_transactions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: factory_item_transactions factory_item_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_item_transactions
    ADD CONSTRAINT factory_item_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.factory_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: factory_items factory_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_items
    ADD CONSTRAINT factory_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.factory_item_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: feature_permissions feature_permissions_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_permissions
    ADD CONSTRAINT feature_permissions_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.feature_modules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feature_permissions feature_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_permissions
    ADD CONSTRAINT feature_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: final_submissions final_submissions_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_submissions
    ADD CONSTRAINT "final_submissions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: final_submissions final_submissions_submittedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_submissions
    ADD CONSTRAINT "final_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leaves leaves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: melting_batches melting_batches_melted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.melting_batches
    ADD CONSTRAINT melting_batches_melted_by_id_fkey FOREIGN KEY (melted_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: metal_payments metal_payments_recorded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_payments
    ADD CONSTRAINT metal_payments_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: metal_payments metal_payments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_payments
    ADD CONSTRAINT metal_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.metal_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: metal_rates metal_rates_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_rates
    ADD CONSTRAINT metal_rates_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: metal_transactions metal_transactions_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_transactions
    ADD CONSTRAINT metal_transactions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: metal_transactions metal_transactions_melting_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_transactions
    ADD CONSTRAINT metal_transactions_melting_batch_id_fkey FOREIGN KEY (melting_batch_id) REFERENCES public.melting_batches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: metal_transactions metal_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_transactions
    ADD CONSTRAINT metal_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: metal_transactions metal_transactions_stock_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_transactions
    ADD CONSTRAINT metal_transactions_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.metal_stock(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: metal_transactions metal_transactions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metal_transactions
    ADD CONSTRAINT metal_transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_activities order_activities_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_activities
    ADD CONSTRAINT "order_activities_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_activities order_activities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_activities
    ADD CONSTRAINT "order_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_comments order_comments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_comments
    ADD CONSTRAINT order_comments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_comments order_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_comments
    ADD CONSTRAINT order_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_details order_details_enteredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT "order_details_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_details order_details_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT "order_details_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payslips payslips_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payslips payslips_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: real_stone_payments real_stone_payments_recorded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_payments
    ADD CONSTRAINT real_stone_payments_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: real_stone_payments real_stone_payments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_payments
    ADD CONSTRAINT real_stone_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.real_stone_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: real_stone_rates real_stone_rates_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_rates
    ADD CONSTRAINT real_stone_rates_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: real_stone_transactions real_stone_transactions_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_transactions
    ADD CONSTRAINT real_stone_transactions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: real_stone_transactions real_stone_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_transactions
    ADD CONSTRAINT real_stone_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: real_stone_transactions real_stone_transactions_stone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_transactions
    ADD CONSTRAINT real_stone_transactions_stone_id_fkey FOREIGN KEY (stone_id) REFERENCES public.real_stones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: real_stone_transactions real_stone_transactions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_stone_transactions
    ADD CONSTRAINT real_stone_transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salary_structures salary_structures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: specification_templates specification_templates_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specification_templates
    ADD CONSTRAINT "specification_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stone_packet_payments stone_packet_payments_recorded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_payments
    ADD CONSTRAINT stone_packet_payments_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stone_packet_payments stone_packet_payments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_payments
    ADD CONSTRAINT stone_packet_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.stone_packet_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stone_packet_transactions stone_packet_transactions_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_transactions
    ADD CONSTRAINT stone_packet_transactions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stone_packet_transactions stone_packet_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_transactions
    ADD CONSTRAINT stone_packet_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stone_packet_transactions stone_packet_transactions_packet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_transactions
    ADD CONSTRAINT stone_packet_transactions_packet_id_fkey FOREIGN KEY (packet_id) REFERENCES public.stone_packets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stone_packet_transactions stone_packet_transactions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stone_packet_transactions
    ADD CONSTRAINT stone_packet_transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stones stones_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stones
    ADD CONSTRAINT "stones_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Ji0y46ZKkHSXakZoXOGqFLHH2odZHlgLRDFKXXIRw55zkc8vMG2LAq6YHf9hZsN

