/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 * 
 * Common utility functions for the frontend.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Combines class names with Tailwind CSS support.
 * Uses clsx for conditional class concatenation.
 * 
 * @param inputs - Class names to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
