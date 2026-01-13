/**
 * ============================================
 * ORDER TYPES
 * ============================================
 *
 * TypeScript types for order creation and management.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// ============================================
// ENUMS
// ============================================

export enum GoldPurity {
  K22 = '22K',
  K18 = '18K',
  K14 = '14K',
  CUSTOM = 'CUSTOM',
}

export enum GoldFinish {
  YELLOW_GOLD = 'YELLOW_GOLD',
  ROSE_GOLD = 'ROSE_GOLD',
  WHITE_GOLD = 'WHITE_GOLD',
  GREEN_GOLD = 'GREEN_GOLD',
  BLACK_GOLD = 'BLACK_GOLD',
  CHAMPAGNE_GOLD = 'CHAMPAGNE_GOLD',
  TWO_TONE_GOLD = 'TWO_TONE_GOLD',
  TRI_COLOR_GOLD = 'TRI_COLOR_GOLD',
  BRUSHED_GOLD = 'BRUSHED_GOLD',
  HAMMERED_GOLD = 'HAMMERED_GOLD',
  SANDBLASTED_GOLD = 'SANDBLASTED_GOLD',
  FLORENTINE_GOLD = 'FLORENTINE_GOLD',
  MILGRAIN_GOLD = 'MILGRAIN_GOLD',
  OTHER_GOLD = 'OTHER_GOLD',
}

export enum SilverFinish {
  STERLING_SILVER = 'STERLING_SILVER',
  FINE_SILVER = 'FINE_SILVER',
  OXIDIZED_SILVER = 'OXIDIZED_SILVER',
  RHODIUM_PLATED = 'RHODIUM_PLATED',
  GOLD_PLATED = 'GOLD_PLATED',
  ROSE_GOLD_PLATED = 'ROSE_GOLD_PLATED',
  BLACK_RHODIUM = 'BLACK_RHODIUM',
  RUTHENIUM_PLATED = 'RUTHENIUM_PLATED',
  TWO_TONE_SILVER = 'TWO_TONE_SILVER',
  BRUSHED_SILVER = 'BRUSHED_SILVER',
  HAMMERED_SILVER = 'HAMMERED_SILVER',
  ANTIQUED_SILVER = 'ANTIQUED_SILVER',
  MIRROR_POLISH = 'MIRROR_POLISH',
  SANDBLASTED_SILVER = 'SANDBLASTED_SILVER',
  OTHER_SILVER = 'OTHER_SILVER',
}

export enum PlatinumFinish {
  POLISHED_PLATINUM = 'POLISHED_PLATINUM',
  MATTE_PLATINUM = 'MATTE_PLATINUM',
  HAMMERED_PLATINUM = 'HAMMERED_PLATINUM',
  SANDBLASTED_PLATINUM = 'SANDBLASTED_PLATINUM',
  MILGRAIN_PLATINUM = 'MILGRAIN_PLATINUM',
  FLORENTINE_PLATINUM = 'FLORENTINE_PLATINUM',
  TWO_TONE_PLATINUM = 'TWO_TONE_PLATINUM',
  BLACK_PLATINUM = 'BLACK_PLATINUM',
  OTHER_PLATINUM = 'OTHER_PLATINUM',
}

export type MetalFinish = GoldFinish | SilverFinish | PlatinumFinish;

export enum StoneType {
  DIAMOND = 'DIAMOND',
  RUBY = 'RUBY',
  EMERALD = 'EMERALD',
  SAPPHIRE = 'SAPPHIRE',
  PEARL = 'PEARL',
  AMETHYST = 'AMETHYST',
  TOPAZ = 'TOPAZ',
  KUNDAN = 'KUNDAN',
  POLKI = 'POLKI',
  CZ = 'CZ',
  AMERICAN_DIAMOND = 'AMERICAN_DIAMOND',
  SEMI_PRECIOUS = 'SEMI_PRECIOUS',
  OTHER = 'OTHER',
}

export enum ProductType {
  RING = 'RING',
  NECKLACE = 'NECKLACE',
  EARRINGS = 'EARRINGS',
  BANGLES = 'BANGLES',
  BRACELET = 'BRACELET',
  PENDANT = 'PENDANT',
  CHAIN = 'CHAIN',
  ANKLET = 'ANKLET',
  MANGALSUTRA = 'MANGALSUTRA',
  NOSE_PIN = 'NOSE_PIN',
  MAANG_TIKKA = 'MAANG_TIKKA',
  WAIST_CHAIN = 'WAIST_CHAIN',
  TOE_RING = 'TOE_RING',
  BROOCH = 'BROOCH',
  CUFFLINKS = 'CUFFLINKS',
  OTHER = 'OTHER',
}

export enum StoneShape {
  ROUND = 'ROUND',
  PRINCESS = 'PRINCESS',
  OVAL = 'OVAL',
  CUSHION = 'CUSHION',
  MARQUISE = 'MARQUISE',
  PEAR = 'PEAR',
  EMERALD = 'EMERALD',
  ASSCHER = 'ASSCHER',
  RADIANT = 'RADIANT',
  HEART = 'HEART',
  BAGUETTE = 'BAGUETTE',
  TRILLION = 'TRILLION',
  OTHER = 'OTHER',
}

export enum StoneSetting {
  PRONG = 'PRONG',
  BEZEL = 'BEZEL',
  CHANNEL = 'CHANNEL',
  PAVE = 'PAVE',
  FLUSH = 'FLUSH',
  TENSION = 'TENSION',
  CLUSTER = 'CLUSTER',
  HALO = 'HALO',
  BAR = 'BAR',
  GYPSY = 'GYPSY',
  INVISIBLE = 'INVISIBLE',
  OTHER = 'OTHER',
}

export enum StoneClarity {
  FL = 'FL', // Flawless
  IF = 'IF', // Internally Flawless
  VVS1 = 'VVS1', // Very Very Slightly Included 1
  VVS2 = 'VVS2', // Very Very Slightly Included 2
  VS1 = 'VS1', // Very Slightly Included 1
  VS2 = 'VS2', // Very Slightly Included 2
  SI1 = 'SI1', // Slightly Included 1
  SI2 = 'SI2', // Slightly Included 2
  I1 = 'I1', // Included 1
  I2 = 'I2', // Included 2
  I3 = 'I3', // Included 3
}

export enum StoneCut {
  EXCELLENT = 'EXCELLENT',
  VERY_GOOD = 'VERY_GOOD',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

// ============================================
// MANUFACTURING ENUMS
// ============================================

export enum MakingChargeType {
  PER_GRAM = 'PER_GRAM',
  FLAT_RATE = 'FLAT_RATE',
  PERCENTAGE = 'PERCENTAGE',
}

export enum ClaspType {
  SPRING_RING = 'SPRING_RING',
  LOBSTER = 'LOBSTER',
  TOGGLE = 'TOGGLE',
  BARREL = 'BARREL',
  MAGNETIC = 'MAGNETIC',
  HOOK = 'HOOK',
  BOX = 'BOX',
  SLIDE = 'SLIDE',
  NONE = 'NONE',
  OTHER = 'OTHER',
}

export enum PolishType {
  HIGH_POLISH = 'HIGH_POLISH',
  MATTE = 'MATTE',
  SANDBLAST = 'SANDBLAST',
  SATIN = 'SATIN',
  BRUSHED = 'BRUSHED',
  MIX = 'MIX',
}

export enum CertificationType {
  NONE = 'NONE',
  IGI = 'IGI',
  GIA = 'GIA',
  INTERNAL = 'INTERNAL',
  OTHER = 'OTHER',
}

export enum DeliveryMethod {
  STORE_PICKUP = 'STORE_PICKUP',
  COURIER = 'COURIER',
  CUSTOMER_VISIT = 'CUSTOMER_VISIT',
  HOME_DELIVERY = 'HOME_DELIVERY',
}

export enum OrderOccasion {
  WEDDING = 'WEDDING',
  ENGAGEMENT = 'ENGAGEMENT',
  DAILY_WEAR = 'DAILY_WEAR',
  GIFT = 'GIFT',
  ANNIVERSARY = 'ANNIVERSARY',
  FESTIVAL = 'FESTIVAL',
  OTHER = 'OTHER',
}

export enum DesignCategory {
  TRADITIONAL = 'TRADITIONAL',
  MODERN = 'MODERN',
  FUSION = 'FUSION',
  ANTIQUE = 'ANTIQUE',
  CONTEMPORARY = 'CONTEMPORARY',
  OTHER = 'OTHER',
}

export enum WarrantyPeriod {
  NONE = 'NONE',
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
  TWO_YEARS = 'TWO_YEARS',
  LIFETIME = 'LIFETIME',
}

export enum PaymentTerms {
  ADVANCE_FULL = 'ADVANCE_FULL',
  ADVANCE_50 = 'ADVANCE_50',
  ON_DELIVERY = 'ON_DELIVERY',
  CUSTOM = 'CUSTOM',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  QUALITY_CHECK = 'QUALITY_CHECK',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// ============================================
// PRODUCT-SPECIFIC SPECIFICATION ENUMS
// ============================================

// Ring Specifications
export enum RingSize {
  SIZE_4 = '4',
  SIZE_4_5 = '4.5',
  SIZE_5 = '5',
  SIZE_5_5 = '5.5',
  SIZE_6 = '6',
  SIZE_6_5 = '6.5',
  SIZE_7 = '7',
  SIZE_7_5 = '7.5',
  SIZE_8 = '8',
  SIZE_8_5 = '8.5',
  SIZE_9 = '9',
  SIZE_9_5 = '9.5',
  SIZE_10 = '10',
  SIZE_10_5 = '10.5',
  SIZE_11 = '11',
  SIZE_11_5 = '11.5',
  SIZE_12 = '12',
  FREE_SIZE = 'FREE_SIZE',
  ADJUSTABLE = 'ADJUSTABLE',
  CUSTOM = 'CUSTOM',
}

export enum RingStyleType {
  SOLITAIRE = 'SOLITAIRE',
  HALO = 'HALO',
  THREE_STONE = 'THREE_STONE',
  ETERNITY_BAND = 'ETERNITY_BAND',
  COCKTAIL = 'COCKTAIL',
  SIGNET = 'SIGNET',
  STACKABLE = 'STACKABLE',
  STATEMENT = 'STATEMENT',
  TRADITIONAL = 'TRADITIONAL',
  CONTEMPORARY = 'CONTEMPORARY',
  VINTAGE = 'VINTAGE',
  CUSTOM = 'CUSTOM',
}

// Necklace & Chain Specifications
export enum NecklaceLength {
  CHOKER_14_16 = '14-16 inches (Choker)',
  PRINCESS_17_19 = '17-19 inches (Princess)',
  MATINEE_20_24 = '20-24 inches (Matinee)',
  OPERA_28_34 = '28-34 inches (Opera)',
  ROPE_35_PLUS = '35+ inches (Rope)',
  CUSTOM = 'CUSTOM',
}

export enum ChainLength {
  INCHES_16 = '16',
  INCHES_18 = '18',
  INCHES_20 = '20',
  INCHES_22 = '22',
  INCHES_24 = '24',
  INCHES_26 = '26',
  INCHES_28 = '28',
  INCHES_30 = '30',
  CUSTOM = 'CUSTOM',
}

export enum LinkStyle {
  CABLE = 'CABLE',
  ROPE = 'ROPE',
  BOX = 'BOX',
  FIGARO = 'FIGARO',
  CURB = 'CURB',
  SINGAPORE = 'SINGAPORE',
  WHEAT = 'WHEAT',
  SNAKE = 'SNAKE',
  BALL = 'BALL',
  PAPERCLIP = 'PAPERCLIP',
  HERRINGBONE = 'HERRINGBONE',
  BYZANTINE = 'BYZANTINE',
  CUSTOM = 'CUSTOM',
}

// Earrings Specifications
export enum EarringsBackType {
  PUSH_BACK = 'PUSH_BACK',
  SCREW_BACK = 'SCREW_BACK',
  LEVER_BACK = 'LEVER_BACK',
  HOOK = 'HOOK',
  HOOP = 'HOOP',
  CLIP_ON = 'CLIP_ON',
  MAGNETIC = 'MAGNETIC',
  HUGGIE = 'HUGGIE',
  CUSTOM = 'CUSTOM',
}

export enum EarringsStyle {
  STUD = 'STUD',
  DROP = 'DROP',
  DANGLE = 'DANGLE',
  HOOP = 'HOOP',
  HUGGIE = 'HUGGIE',
  CHANDELIER = 'CHANDELIER',
  JHUMKA = 'JHUMKA',
  CLUSTER = 'CLUSTER',
  CONTEMPORARY = 'CONTEMPORARY',
  TRADITIONAL = 'TRADITIONAL',
  CUSTOM = 'CUSTOM',
}

// Bangles & Bracelet Specifications
export enum BangleSize {
  SIZE_2_2 = '2.2',
  SIZE_2_4 = '2.4',
  SIZE_2_6 = '2.6',
  SIZE_2_8 = '2.8',
  SIZE_2_10 = '2.10',
  SIZE_2_12 = '2.12',
  FREE_SIZE = 'FREE_SIZE',
  ADJUSTABLE = 'ADJUSTABLE',
  CUSTOM = 'CUSTOM',
}

export enum BangleOpeningType {
  SCREW = 'SCREW',
  HINGE = 'HINGE',
  HOOK = 'HOOK',
  CLOSED = 'CLOSED',
  FLEXIBLE = 'FLEXIBLE',
  CUSTOM = 'CUSTOM',
}

export enum BraceletSize {
  SIZE_6_5 = '6.5',
  SIZE_7 = '7',
  SIZE_7_5 = '7.5',
  SIZE_8 = '8',
  SIZE_8_5 = '8.5',
  SIZE_9 = '9',
  ADJUSTABLE = 'ADJUSTABLE',
  CUSTOM = 'CUSTOM',
}

// Pendant & Bail Type
export enum BailType {
  FIXED = 'FIXED',
  SLIDING = 'SLIDING',
  HINGED = 'HINGED',
  SCREW_TOP = 'SCREW_TOP',
  HIDDEN = 'HIDDEN',
  JUMP_RING = 'JUMP_RING',
  CUSTOM = 'CUSTOM',
}

// Nose Pin Specifications
export enum NosePinType {
  STUD = 'STUD',
  L_SHAPE = 'L_SHAPE',
  SCREW = 'SCREW',
  HOOP = 'HOOP',
  BONE = 'BONE',
  FISHTAIL = 'FISHTAIL',
  NOSE_RING = 'NOSE_RING',
  NATH = 'NATH',
  CUSTOM = 'CUSTOM',
}

export enum GaugeSize {
  GAUGE_20 = '20G (0.8mm)',
  GAUGE_18 = '18G (1.0mm)',
  GAUGE_16 = '16G (1.2mm)',
  GAUGE_14 = '14G (1.6mm)',
  CUSTOM = 'CUSTOM',
}

// Anklet Specifications
export enum AnkletLength {
  INCHES_9 = '9',
  INCHES_9_5 = '9.5',
  INCHES_10 = '10',
  INCHES_10_5 = '10.5',
  INCHES_11 = '11',
  ADJUSTABLE = 'ADJUSTABLE',
  CUSTOM = 'CUSTOM',
}

// Mangalsutra Specifications
export enum MangalsutraLength {
  SHORT_18_20 = '18-20 inches (Short)',
  MEDIUM_22_24 = '22-24 inches (Medium)',
  LONG_26_30 = '26-30 inches (Long)',
  CUSTOM = 'CUSTOM',
}

export enum MangalsutraStyle {
  SINGLE_LINE = 'SINGLE_LINE',
  DOUBLE_LINE = 'DOUBLE_LINE',
  TRIPLE_LINE = 'TRIPLE_LINE',
  VATI_STYLE = 'VATI_STYLE',
  MODERN = 'MODERN',
  TRADITIONAL = 'TRADITIONAL',
  CUSTOM = 'CUSTOM',
}

// Maang Tikka Specifications
export enum MaangTikkaStyle {
  TRADITIONAL = 'TRADITIONAL',
  CONTEMPORARY = 'CONTEMPORARY',
  CHAND_BALI = 'CHAND_BALI',
  PASSA_STYLE = 'PASSA_STYLE',
  MATHA_PATTI = 'MATHA_PATTI',
  MINIMAL = 'MINIMAL',
  STATEMENT = 'STATEMENT',
  CUSTOM = 'CUSTOM',
}

// Waist Chain Specifications
export enum WaistChainLength {
  SMALL_28_32 = '28-32 inches (Small)',
  MEDIUM_34_38 = '34-38 inches (Medium)',
  LARGE_40_44 = '40-44 inches (Large)',
  ADJUSTABLE = 'ADJUSTABLE',
  CUSTOM = 'CUSTOM',
}

// Cufflinks Specifications
export enum CufflinksStyle {
  CLASSIC_TOGGLE = 'CLASSIC_TOGGLE',
  BULLET_BACK = 'BULLET_BACK',
  WHALE_BACK = 'WHALE_BACK',
  CHAIN_LINK = 'CHAIN_LINK',
  STUD = 'STUD',
  MODERN = 'MODERN',
  TRADITIONAL = 'TRADITIONAL',
  CUSTOM = 'CUSTOM',
}

// Brooch Specifications
export enum BroochStyle {
  PIN_BACK = 'PIN_BACK',
  SAFETY_CATCH = 'SAFETY_CATCH',
  MAGNETIC = 'MAGNETIC',
  TRADITIONAL = 'TRADITIONAL',
  CONTEMPORARY = 'CONTEMPORARY',
  STATEMENT = 'STATEMENT',
  CUSTOM = 'CUSTOM',
}

// ============================================
// FORM STEP TYPES
// ============================================

export interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

// ============================================
// PRODUCT-SPECIFIC SPECIFICATIONS INTERFACES
// ============================================

export interface RingSpecifications {
  size?: string;
  customSize?: string;
  ringStyle?: string;
  customRingStyle?: string;
  bandWidth?: number;
  bandThickness?: number;
  isResizable?: boolean;
  engraving?: string;
}

export interface NecklaceSpecifications {
  length?: string;
  customLength?: string;
  claspType?: ClaspType;
  customClaspType?: string;
  chainThickness?: number;
  layered?: boolean;
  numberOfLayers?: number;
  adjustableLength?: boolean;
}

export interface EarringsSpecifications {
  backType?: string;
  customBackType?: string;
  earringsStyle?: string;
  customEarringsStyle?: string;
  dropLength?: number;
  isPair?: boolean;
  isMatching?: boolean;
}

export interface BanglesSpecifications {
  size?: string;
  customSize?: string;
  openingType?: string;
  customOpeningType?: string;
  width?: number;
  thickness?: number;
  quantity?: number;
  isSet?: boolean;
}

export interface BraceletSpecifications {
  length?: string;
  customLength?: string;
  claspType?: ClaspType;
  customClaspType?: string;
  width?: number;
  thickness?: number;
  isAdjustable?: boolean;
  charmAttachments?: boolean;
}

export interface PendantSpecifications {
  length?: number;
  width?: number;
  thickness?: number;
  bailType?: string;
  customBailType?: string;
  includesChain?: boolean;
  chainLength?: string;
  customChainLength?: string;
}

export interface ChainSpecifications {
  length?: string;
  customLength?: string;
  linkStyle?: string;
  customLinkStyle?: string;
  thickness?: number;
  claspType?: ClaspType;
  customClaspType?: string;
  isAdjustable?: boolean;
}

export interface AnkletSpecifications {
  length?: string;
  customLength?: string;
  claspType?: ClaspType;
  customClaspType?: string;
  thickness?: number;
  charmAttachments?: boolean;
  isAdjustable?: boolean;
}

export interface MangalsutraSpecifications {
  length?: string;
  customLength?: string;
  style?: string;
  customStyle?: string;
  numberOfVatis?: number;
  vatiSize?: number;
  blackBeadsIncluded?: boolean;
  numberOfBlackBeads?: number;
}

export interface NosePinSpecifications {
  type?: string;
  customType?: string;
  gaugeSize?: string;
  customGaugeSize?: string;
  length?: number;
  stoneSize?: number;
}

export interface MaangTikkaSpecifications {
  style?: string;
  customStyle?: string;
  centerPieceLength?: number;
  centerPieceWidth?: number;
  chainLength?: number;
  hasHairHook?: boolean;
}

export interface WaistChainSpecifications {
  length?: string;
  customLength?: string;
  style?: string;
  customStyle?: string;
  numberOfStrands?: number;
  claspType?: ClaspType;
  customClaspType?: string;
  isAdjustable?: boolean;
}

export interface ToeRingSpecifications {
  size?: string;
  customSize?: string;
  isAdjustable?: boolean;
  isPair?: boolean;
  quantity?: number;
}

export interface BroochSpecifications {
  style?: string;
  customStyle?: string;
  length?: number;
  width?: number;
  pinLength?: number;
  hasSafetyCatch?: boolean;
}

export interface CufflinksSpecifications {
  style?: string;
  customStyle?: string;
  faceLength?: number;
  faceWidth?: number;
  isPair?: boolean;
  includesBox?: boolean;
}

export interface OtherSpecifications {
  description?: string;
  dimensions?: string;
  specialFeatures?: string;
}

export type ProductSpecifications =
  | RingSpecifications
  | NecklaceSpecifications
  | EarringsSpecifications
  | BanglesSpecifications
  | BraceletSpecifications
  | PendantSpecifications
  | ChainSpecifications
  | AnkletSpecifications
  | MangalsutraSpecifications
  | NosePinSpecifications
  | MaangTikkaSpecifications
  | WaistChainSpecifications
  | ToeRingSpecifications
  | BroochSpecifications
  | CufflinksSpecifications
  | OtherSpecifications;

export interface BasicInfoFormData {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  productImages?: ImagePreview[];
  // Legacy single image support (kept for backward compatibility)
  productImage?: File | null;
  productImagePreview?: string;
}

export interface GoldDetailsFormData {
  grossWeight?: number;
  netWeight?: number;
  purity: GoldPurity;
  customPurity?: number; // For custom purity percentage
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  metalFinish: MetalFinish;
  customFinish?: string; // For "Other" finish option
  productType: ProductType;
  customProductType?: string; // For "Other" product type
  quantity: number;
  productSpecifications?: ProductSpecifications; // Product-specific details
}

export interface StoneItem {
  id: string;
  type: StoneType;
  customType?: string; // For "Other" stone type
  weight: number;
  quantity: number;
  shape?: StoneShape;
  customShape?: string; // For "Other" shape
  setting?: StoneSetting;
  customSetting?: string; // For "Other" setting
  color?: string;
  clarity?: StoneClarity;
  cut?: StoneCut;
  description?: string;
}

export interface StoneDetailsFormData {
  hasStones: boolean;
  stones: StoneItem[];
  totalStoneWeight: number;
}

export interface AdditionalInfoFormData {
  size?: string;
  dueDate: Date | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  description?: string;
  specialInstructions?: string;
  referenceImages?: File[];
  referenceImagePreviews?: string[];
  // CAD/Design Files
  cadFiles?: File[];
  cadFilePreviews?: string[];
  // Hallmark Details
  hallmarkRequired: boolean;
  huidNumber?: string;
  bisHallmark?: string;
  // Pricing Details
  makingChargeType?: MakingChargeType;
  makingChargeValue?: number;
  wastagePercentage?: number;
  laborCharges?: number;
  // Manufacturing Instructions
  meltingInstructions?: string;
  claspType?: ClaspType;
  engravingText?: string;
  polishType?: PolishType;
  rhodiumPlating: boolean;
  // Certification
  certificationRequired?: CertificationType;
  // Customer's Old Gold
  usingCustomerGold: boolean;
  customerGoldWeight?: number;
  customerGoldPurity?: number;
  // Logistics & Classification
  deliveryMethod?: DeliveryMethod;
  customerAddress?: string;
  occasion?: OrderOccasion;
  designCategory?: DesignCategory;
  warrantyPeriod?: WarrantyPeriod;
  exchangeAllowed: boolean;
  paymentTerms?: PaymentTerms;
  advancePercentage?: number;
  goldRateLocked: boolean;
  expectedGoldRate?: number;
  // Price Estimation
  estimatedGoldCost?: number;
  estimatedStoneCost?: number;
  estimatedMakingCharges?: number;
  estimatedOtherCharges?: number;
  estimatedTotalCost?: number;
  // Template & Cloning
  templateName?: string; // Save order as template with this name
  clonedFromOrderId?: string; // If cloned, reference to original order
}

// ============================================
// COMPLETE ORDER FORM DATA
// ============================================

export interface OrderFormData {
  basicInfo: BasicInfoFormData;
  goldDetails: GoldDetailsFormData;
  stoneDetails: StoneDetailsFormData;
  additionalInfo: AdditionalInfoFormData;
}

// ============================================
// FORM STEP CONFIG
// ============================================

export interface FormStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// ============================================
// CONSTANTS
// ============================================

export const PURITY_OPTIONS = [
  { value: GoldPurity.K22, label: '22 Karat (91.6%)', percentage: 91.6 },
  { value: GoldPurity.K18, label: '18 Karat (75%)', percentage: 75 },
  { value: GoldPurity.K14, label: '14 Karat (58.3%)', percentage: 58.3 },
  { value: GoldPurity.CUSTOM, label: 'Custom', percentage: 0 },
];

export const GOLD_FINISH_OPTIONS = [
  {
    value: GoldFinish.YELLOW_GOLD,
    label: 'Yellow Gold',
    description: 'Classic warm golden color (most traditional)',
  },
  {
    value: GoldFinish.ROSE_GOLD,
    label: 'Rose Gold',
    description: 'Pinkish-red hue (copper alloy)',
  },
  {
    value: GoldFinish.WHITE_GOLD,
    label: 'White Gold',
    description: 'Silvery-white (rhodium plated)',
  },
  {
    value: GoldFinish.GREEN_GOLD,
    label: 'Green Gold',
    description: 'Greenish tint (gold-silver alloy, rare)',
  },
  {
    value: GoldFinish.BLACK_GOLD,
    label: 'Black Gold',
    description: 'Black coating (electroplating/PVD)',
  },
  {
    value: GoldFinish.CHAMPAGNE_GOLD,
    label: 'Champagne Gold',
    description: 'Soft warm beige-gold tone',
  },
  {
    value: GoldFinish.TWO_TONE_GOLD,
    label: 'Two-Tone Gold',
    description: 'Combination (e.g., Yellow + White)',
  },
  {
    value: GoldFinish.TRI_COLOR_GOLD,
    label: 'Tri-Color Gold',
    description: 'Three gold colors combined',
  },
  {
    value: GoldFinish.BRUSHED_GOLD,
    label: 'Brushed/Matte Gold',
    description: 'Satin non-reflective finish',
  },
  {
    value: GoldFinish.HAMMERED_GOLD,
    label: 'Hammered Gold',
    description: 'Textured artisan surface',
  },
  {
    value: GoldFinish.SANDBLASTED_GOLD,
    label: 'Sandblasted Gold',
    description: 'Grainy matte texture',
  },
  {
    value: GoldFinish.FLORENTINE_GOLD,
    label: 'Florentine Gold',
    description: 'Crosshatch engraved pattern',
  },
  { value: GoldFinish.MILGRAIN_GOLD, label: 'Milgrain Gold', description: 'Beaded edge detailing' },
  { value: GoldFinish.OTHER_GOLD, label: 'Other', description: 'Specify custom finish' },
];

export const SILVER_FINISH_OPTIONS = [
  {
    value: SilverFinish.STERLING_SILVER,
    label: 'Sterling Silver',
    description: 'Standard bright silver (92.5% pure)',
  },
  {
    value: SilverFinish.FINE_SILVER,
    label: 'Fine Silver',
    description: '99.9% pure silver (softer, brighter)',
  },
  {
    value: SilverFinish.OXIDIZED_SILVER,
    label: 'Oxidized Silver',
    description: 'Darkened/blackened antique look',
  },
  {
    value: SilverFinish.RHODIUM_PLATED,
    label: 'Rhodium Plated',
    description: 'Bright white, tarnish-resistant',
  },
  {
    value: SilverFinish.GOLD_PLATED,
    label: 'Gold Plated (Vermeil)',
    description: 'Yellow gold layer over silver',
  },
  {
    value: SilverFinish.ROSE_GOLD_PLATED,
    label: 'Rose Gold Plated',
    description: 'Rose gold layer over silver',
  },
  {
    value: SilverFinish.BLACK_RHODIUM,
    label: 'Black Rhodium',
    description: 'Dark gunmetal/charcoal finish',
  },
  {
    value: SilverFinish.RUTHENIUM_PLATED,
    label: 'Ruthenium Plated',
    description: 'Dark grey metallic finish',
  },
  {
    value: SilverFinish.TWO_TONE_SILVER,
    label: 'Two-Tone Silver',
    description: 'Silver with gold/rose gold accents',
  },
  {
    value: SilverFinish.BRUSHED_SILVER,
    label: 'Brushed/Matte Silver',
    description: 'Satin non-reflective finish',
  },
  {
    value: SilverFinish.HAMMERED_SILVER,
    label: 'Hammered Silver',
    description: 'Textured artisan surface',
  },
  {
    value: SilverFinish.ANTIQUED_SILVER,
    label: 'Antiqued Silver',
    description: 'Aged vintage appearance',
  },
  {
    value: SilverFinish.MIRROR_POLISH,
    label: 'Mirror Polish',
    description: 'High shine reflective',
  },
  {
    value: SilverFinish.SANDBLASTED_SILVER,
    label: 'Sandblasted Silver',
    description: 'Grainy matte texture',
  },
  { value: SilverFinish.OTHER_SILVER, label: 'Other', description: 'Specify custom finish' },
];

export const PLATINUM_FINISH_OPTIONS = [
  {
    value: PlatinumFinish.POLISHED_PLATINUM,
    label: 'Polished Platinum',
    description: 'High shine mirror finish',
  },
  {
    value: PlatinumFinish.MATTE_PLATINUM,
    label: 'Matte Platinum',
    description: 'Satin/brushed non-reflective',
  },
  {
    value: PlatinumFinish.HAMMERED_PLATINUM,
    label: 'Hammered Platinum',
    description: 'Textured artisan surface',
  },
  {
    value: PlatinumFinish.SANDBLASTED_PLATINUM,
    label: 'Sandblasted Platinum',
    description: 'Grainy matte texture',
  },
  {
    value: PlatinumFinish.MILGRAIN_PLATINUM,
    label: 'Milgrain Platinum',
    description: 'Beaded edge detailing',
  },
  {
    value: PlatinumFinish.FLORENTINE_PLATINUM,
    label: 'Florentine Platinum',
    description: 'Crosshatch engraved pattern',
  },
  {
    value: PlatinumFinish.TWO_TONE_PLATINUM,
    label: 'Two-Tone Platinum',
    description: 'Platinum with gold accents',
  },
  {
    value: PlatinumFinish.BLACK_PLATINUM,
    label: 'Black Platinum',
    description: 'PVD coated dark finish (rare)',
  },
  { value: PlatinumFinish.OTHER_PLATINUM, label: 'Other', description: 'Specify custom finish' },
];

export const STONE_TYPE_OPTIONS = [
  { value: StoneType.DIAMOND, label: 'Diamond' },
  { value: StoneType.RUBY, label: 'Ruby' },
  { value: StoneType.EMERALD, label: 'Emerald' },
  { value: StoneType.SAPPHIRE, label: 'Sapphire' },
  { value: StoneType.PEARL, label: 'Pearl' },
  { value: StoneType.AMETHYST, label: 'Amethyst' },
  { value: StoneType.TOPAZ, label: 'Topaz' },
  { value: StoneType.KUNDAN, label: 'Kundan' },
  { value: StoneType.POLKI, label: 'Polki' },
  { value: StoneType.CZ, label: 'Cubic Zirconia (CZ)' },
  { value: StoneType.AMERICAN_DIAMOND, label: 'American Diamond' },
  { value: StoneType.SEMI_PRECIOUS, label: 'Semi-Precious' },
  { value: StoneType.OTHER, label: 'Other' },
];

export const STONE_SHAPE_OPTIONS = [
  { value: StoneShape.ROUND, label: 'Round' },
  { value: StoneShape.PRINCESS, label: 'Princess' },
  { value: StoneShape.OVAL, label: 'Oval' },
  { value: StoneShape.CUSHION, label: 'Cushion' },
  { value: StoneShape.MARQUISE, label: 'Marquise' },
  { value: StoneShape.PEAR, label: 'Pear' },
  { value: StoneShape.EMERALD, label: 'Emerald Cut' },
  { value: StoneShape.ASSCHER, label: 'Asscher' },
  { value: StoneShape.RADIANT, label: 'Radiant' },
  { value: StoneShape.HEART, label: 'Heart' },
  { value: StoneShape.BAGUETTE, label: 'Baguette' },
  { value: StoneShape.TRILLION, label: 'Trillion' },
  { value: StoneShape.OTHER, label: 'Other' },
];

export const STONE_SETTING_OPTIONS = [
  { value: StoneSetting.PRONG, label: 'Prong' },
  { value: StoneSetting.BEZEL, label: 'Bezel' },
  { value: StoneSetting.CHANNEL, label: 'Channel' },
  { value: StoneSetting.PAVE, label: 'Pavé' },
  { value: StoneSetting.FLUSH, label: 'Flush' },
  { value: StoneSetting.TENSION, label: 'Tension' },
  { value: StoneSetting.CLUSTER, label: 'Cluster' },
  { value: StoneSetting.HALO, label: 'Halo' },
  { value: StoneSetting.BAR, label: 'Bar' },
  { value: StoneSetting.GYPSY, label: 'Gypsy' },
  { value: StoneSetting.INVISIBLE, label: 'Invisible' },
  { value: StoneSetting.OTHER, label: 'Other' },
];

export const STONE_CLARITY_OPTIONS = [
  { value: StoneClarity.FL, label: 'FL (Flawless)' },
  { value: StoneClarity.IF, label: 'IF (Internally Flawless)' },
  { value: StoneClarity.VVS1, label: 'VVS1' },
  { value: StoneClarity.VVS2, label: 'VVS2' },
  { value: StoneClarity.VS1, label: 'VS1' },
  { value: StoneClarity.VS2, label: 'VS2' },
  { value: StoneClarity.SI1, label: 'SI1' },
  { value: StoneClarity.SI2, label: 'SI2' },
  { value: StoneClarity.I1, label: 'I1' },
  { value: StoneClarity.I2, label: 'I2' },
  { value: StoneClarity.I3, label: 'I3' },
];

export const STONE_CUT_OPTIONS = [
  { value: StoneCut.EXCELLENT, label: 'Excellent' },
  { value: StoneCut.VERY_GOOD, label: 'Very Good' },
  { value: StoneCut.GOOD, label: 'Good' },
  { value: StoneCut.FAIR, label: 'Fair' },
  { value: StoneCut.POOR, label: 'Poor' },
];

export const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.RING, label: 'Ring', icon: '💍' },
  { value: ProductType.NECKLACE, label: 'Necklace', icon: '📿' },
  { value: ProductType.EARRINGS, label: 'Earrings', icon: '👂' },
  { value: ProductType.BANGLES, label: 'Bangles', icon: '⭕' },
  { value: ProductType.BRACELET, label: 'Bracelet', icon: '⌚' },
  { value: ProductType.PENDANT, label: 'Pendant', icon: '🔶' },
  { value: ProductType.CHAIN, label: 'Chain', icon: '🔗' },
  { value: ProductType.ANKLET, label: 'Anklet', icon: '🦶' },
  { value: ProductType.MANGALSUTRA, label: 'Mangalsutra', icon: '📿' },
  { value: ProductType.NOSE_PIN, label: 'Nose Pin', icon: '👃' },
  { value: ProductType.MAANG_TIKKA, label: 'Maang Tikka', icon: '✨' },
  { value: ProductType.WAIST_CHAIN, label: 'Waist Chain', icon: '🔗' },
  { value: ProductType.TOE_RING, label: 'Toe Ring', icon: '🦶' },
  { value: ProductType.BROOCH, label: 'Brooch', icon: '📌' },
  { value: ProductType.CUFFLINKS, label: 'Cufflinks', icon: '🔘' },
  { value: ProductType.OTHER, label: 'Other', icon: '✨' },
];

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'text-gray-600 bg-gray-100' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-600 bg-blue-100' },
  { value: 'HIGH', label: 'High', color: 'text-amber-600 bg-amber-100' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600 bg-red-100' },
];

export const MAKING_CHARGE_TYPE_OPTIONS = [
  { value: MakingChargeType.PER_GRAM, label: 'Per Gram', description: 'Charge per gram of gold' },
  { value: MakingChargeType.FLAT_RATE, label: 'Flat Rate', description: 'Fixed amount' },
  { value: MakingChargeType.PERCENTAGE, label: 'Percentage', description: '% of gold value' },
];

export const CLASP_TYPE_OPTIONS = [
  { value: ClaspType.SPRING_RING, label: 'Spring Ring' },
  { value: ClaspType.LOBSTER, label: 'Lobster Claw' },
  { value: ClaspType.TOGGLE, label: 'Toggle' },
  { value: ClaspType.BARREL, label: 'Barrel' },
  { value: ClaspType.MAGNETIC, label: 'Magnetic' },
  { value: ClaspType.HOOK, label: 'Hook & Eye' },
  { value: ClaspType.BOX, label: 'Box Clasp' },
  { value: ClaspType.SLIDE, label: 'Slide Lock' },
  { value: ClaspType.NONE, label: 'None' },
  { value: ClaspType.OTHER, label: 'Other' },
];

export const POLISH_TYPE_OPTIONS = [
  { value: PolishType.HIGH_POLISH, label: 'High Polish', description: 'Mirror-like shine' },
  { value: PolishType.MATTE, label: 'Matte', description: 'Non-reflective finish' },
  { value: PolishType.SANDBLAST, label: 'Sandblast', description: 'Textured matte' },
  { value: PolishType.SATIN, label: 'Satin', description: 'Soft sheen finish' },
  { value: PolishType.BRUSHED, label: 'Brushed', description: 'Linear texture' },
  { value: PolishType.MIX, label: 'Mixed', description: 'Combination finish' },
];

export const CERTIFICATION_OPTIONS = [
  { value: CertificationType.NONE, label: 'Not Required' },
  { value: CertificationType.IGI, label: 'IGI Certification' },
  { value: CertificationType.GIA, label: 'GIA Certification' },
  { value: CertificationType.INTERNAL, label: 'Internal Certificate' },
  { value: CertificationType.OTHER, label: 'Other' },
];

export const DELIVERY_METHOD_OPTIONS = [
  { value: DeliveryMethod.STORE_PICKUP, label: 'Store Pickup' },
  { value: DeliveryMethod.COURIER, label: 'Courier Delivery' },
  { value: DeliveryMethod.CUSTOMER_VISIT, label: 'Customer Visit' },
  { value: DeliveryMethod.HOME_DELIVERY, label: 'Home Delivery' },
];

export const OCCASION_OPTIONS = [
  { value: OrderOccasion.WEDDING, label: 'Wedding' },
  { value: OrderOccasion.ENGAGEMENT, label: 'Engagement' },
  { value: OrderOccasion.DAILY_WEAR, label: 'Daily Wear' },
  { value: OrderOccasion.GIFT, label: 'Gift' },
  { value: OrderOccasion.ANNIVERSARY, label: 'Anniversary' },
  { value: OrderOccasion.FESTIVAL, label: 'Festival' },
  { value: OrderOccasion.OTHER, label: 'Other' },
];

export const DESIGN_CATEGORY_OPTIONS = [
  { value: DesignCategory.TRADITIONAL, label: 'Traditional' },
  { value: DesignCategory.MODERN, label: 'Modern' },
  { value: DesignCategory.FUSION, label: 'Fusion' },
  { value: DesignCategory.ANTIQUE, label: 'Antique' },
  { value: DesignCategory.CONTEMPORARY, label: 'Contemporary' },
  { value: DesignCategory.OTHER, label: 'Other' },
];

export const WARRANTY_PERIOD_OPTIONS = [
  { value: WarrantyPeriod.NONE, label: 'No Warranty' },
  { value: WarrantyPeriod.SIX_MONTHS, label: '6 Months' },
  { value: WarrantyPeriod.ONE_YEAR, label: '1 Year' },
  { value: WarrantyPeriod.TWO_YEARS, label: '2 Years' },
  { value: WarrantyPeriod.LIFETIME, label: 'Lifetime' },
];

export const PAYMENT_TERMS_OPTIONS = [
  { value: PaymentTerms.ADVANCE_FULL, label: '100% Advance' },
  { value: PaymentTerms.ADVANCE_50, label: '50% Advance, 50% on Delivery' },
  { value: PaymentTerms.ON_DELIVERY, label: 'Full Payment on Delivery' },
  { value: PaymentTerms.CUSTOM, label: 'Custom Terms' },
];

// ============================================
// INITIAL VALUES
// ============================================

export const getInitialOrderFormData = (): OrderFormData => ({
  basicInfo: {
    orderNumber: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productImage: null,
    productImagePreview: '',
  },
  goldDetails: {
    grossWeight: 0,
    netWeight: 0,
    purity: GoldPurity.K22,
    customPurity: undefined,
    metalType: 'GOLD',
    metalFinish: GoldFinish.YELLOW_GOLD,
    customFinish: undefined,
    productType: ProductType.RING,
    quantity: 1,
  },
  stoneDetails: {
    hasStones: false,
    stones: [],
    totalStoneWeight: 0,
  },
  additionalInfo: {
    size: '',
    dueDate: null,
    priority: 'NORMAL',
    description: '',
    specialInstructions: '',
    referenceImages: [],
    referenceImagePreviews: [],
    cadFiles: [],
    cadFilePreviews: [],
    hallmarkRequired: true,
    huidNumber: '',
    bisHallmark: '',
    makingChargeType: undefined,
    makingChargeValue: undefined,
    wastagePercentage: undefined,
    laborCharges: undefined,
    meltingInstructions: '',
    claspType: undefined,
    engravingText: '',
    polishType: undefined,
    rhodiumPlating: false,
    certificationRequired: CertificationType.NONE,
    usingCustomerGold: false,
    customerGoldWeight: undefined,
    customerGoldPurity: undefined,
    deliveryMethod: undefined,
    customerAddress: '',
    occasion: undefined,
    designCategory: undefined,
    warrantyPeriod: undefined,
    exchangeAllowed: false,
    paymentTerms: undefined,
    advancePercentage: undefined,
    goldRateLocked: false,
    expectedGoldRate: undefined,
    estimatedGoldCost: undefined,
    estimatedStoneCost: undefined,
    estimatedMakingCharges: undefined,
    estimatedOtherCharges: undefined,
    estimatedTotalCost: undefined,
    templateName: '',
    clonedFromOrderId: undefined,
  },
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format metal finish enum value for display
 * Converts YELLOW_GOLD to "Yellow Gold", etc.
 */
export const formatMetalFinish = (
  finish: MetalFinish | string | undefined | null,
  customFinish?: string | null
): string => {
  if (!finish) return '';

  // If it's an "Other" finish and customFinish is provided
  if (
    (finish === GoldFinish.OTHER_GOLD ||
      finish === SilverFinish.OTHER_SILVER ||
      finish === PlatinumFinish.OTHER_PLATINUM) &&
    customFinish
  ) {
    return customFinish;
  }

  // Find in options arrays
  const allOptions = [...GOLD_FINISH_OPTIONS, ...SILVER_FINISH_OPTIONS, ...PLATINUM_FINISH_OPTIONS];
  const option = allOptions.find((opt) => opt.value === finish);
  if (option) {
    return option.label;
  }

  // Fallback: format the enum value
  return finish
    .replace(/_/g, ' ')
    .replace(/GOLD|SILVER|PLATINUM/g, '')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
