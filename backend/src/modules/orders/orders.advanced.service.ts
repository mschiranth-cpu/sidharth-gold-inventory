/**
 * ============================================
 * ORDERS ADVANCED FEATURES SERVICE
 * ============================================
 *
 * Business logic for advanced features
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

/**
 * Get specification templates for a user
 */
export async function getSpecificationTemplates(productType?: string, userId?: string) {
  try {
    const where: any = {};

    if (productType) {
      where.productType = productType;
    }

    if (userId) {
      where.OR = [{ userId }, { isPublic: true }];
    } else {
      where.isPublic = true;
    }

    const templates = await prisma.specificationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return templates;
  } catch (error) {
    logger.error('Error fetching specification templates:', error);
    throw error;
  }
}

/**
 * Save a new specification template
 */
export async function saveSpecificationTemplate(data: {
  name: string;
  productType: string;
  specifications: any;
  userId: string;
  isPublic?: boolean;
}) {
  try {
    const template = await prisma.specificationTemplate.create({
      data: {
        name: data.name,
        productType: data.productType,
        specifications: data.specifications,
        userId: data.userId,
        isPublic: data.isPublic || false,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return template;
  } catch (error) {
    logger.error('Error saving specification template:', error);
    throw error;
  }
}

/**
 * Delete a specification template
 */
export async function deleteSpecificationTemplate(templateId: string, userId: string) {
  try {
    // Check if template exists and belongs to user
    const template = await prisma.specificationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.userId !== userId) {
      throw new Error('Unauthorized to delete this template');
    }

    await prisma.specificationTemplate.delete({
      where: { id: templateId },
    });

    return true;
  } catch (error) {
    logger.error('Error deleting specification template:', error);
    throw error;
  }
}

/**
 * Get specification analytics
 */
export async function getSpecificationAnalytics(params: {
  productType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const where: any = {
      orderDetails: {
        path: ['productSpecifications'],
        not: null,
      },
    };

    if (params.productType) {
      where.orderDetails = {
        ...where.orderDetails,
        path: ['productType'],
        equals: params.productType,
      };
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        orderDetails: true,
        createdAt: true,
      },
    });

    // Analyze specifications
    const specCounts: Record<string, Record<string, number>> = {};
    const productTypeCounts: Record<string, number> = {};

    orders.forEach((order) => {
      const details = order.orderDetails as any;
      const productType = details?.productType;
      const specs = details?.productSpecifications;

      if (productType) {
        productTypeCounts[productType] = (productTypeCounts[productType] || 0) + 1;
      }

      if (specs && typeof specs === 'object') {
        Object.entries(specs).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (!specCounts[key]) {
              specCounts[key] = {};
            }
            const valueStr = String(value);
            specCounts[key][valueStr] = (specCounts[key][valueStr] || 0) + 1;
          }
        });
      }
    });

    // Get most common values for each specification
    const mostUsedSpecs = Object.entries(specCounts)
      .map(([key, values]) => {
        const sorted = Object.entries(values)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        return {
          field: key,
          topValues: sorted.map(([value, count]) => ({ value, count })),
          totalUsage: Object.values(values).reduce((a, b) => a + b, 0),
        };
      })
      .sort((a, b) => b.totalUsage - a.totalUsage);

    return {
      totalOrders: orders.length,
      productTypeCounts,
      mostUsedSpecs,
      dateRange: {
        start: params.startDate,
        end: params.endDate,
      },
    };
  } catch (error) {
    logger.error('Error getting specification analytics:', error);
    throw error;
  }
}

/**
 * Get order history for a customer (by phone)
 */
export async function getOrderHistory(customerPhone: string, limit: number = 5) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        customer: {
          phone: customerPhone,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderId: true,
        orderDetails: true,
        status: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return orders;
  } catch (error) {
    logger.error('Error getting order history:', error);
    throw error;
  }
}

/**
 * Get measurement conversion data
 */
export function getMeasurementConversions() {
  return {
    ringSize: {
      US: {
        4: { EU: 46.5, UK: 'H', diameter: 14.9 },
        4.5: { EU: 47.4, UK: 'I', diameter: 15.1 },
        5: { EU: 48.3, UK: 'J', diameter: 15.3 },
        5.5: { EU: 49.3, UK: 'K', diameter: 15.7 },
        6: { EU: 50.2, UK: 'L', diameter: 16.0 },
        6.5: { EU: 51.2, UK: 'M', diameter: 16.3 },
        7: { EU: 52.1, UK: 'N', diameter: 16.5 },
        7.5: { EU: 53.1, UK: 'O', diameter: 16.9 },
        8: { EU: 54.0, UK: 'P', diameter: 17.2 },
        8.5: { EU: 55.0, UK: 'Q', diameter: 17.5 },
        9: { EU: 55.9, UK: 'R', diameter: 17.8 },
        9.5: { EU: 56.9, UK: 'S', diameter: 18.1 },
        10: { EU: 57.8, UK: 'T', diameter: 18.4 },
        10.5: { EU: 58.8, UK: 'U', diameter: 18.7 },
        11: { EU: 59.7, UK: 'V', diameter: 19.0 },
        11.5: { EU: 60.7, UK: 'W', diameter: 19.3 },
        12: { EU: 61.6, UK: 'X', diameter: 19.6 },
      },
    },
    bangleSize: {
      inches: {
        2.2: { cm: 5.6, description: 'Extra Small' },
        2.4: { cm: 6.1, description: 'Small' },
        2.6: { cm: 6.6, description: 'Medium' },
        2.8: { cm: 7.1, description: 'Large' },
        2.1: { cm: 7.6, description: 'Extra Large' },
        2.12: { cm: 8.1, description: 'XXL' },
      },
    },
    necklaceLength: {
      inches: {
        14: { cm: 35.6, type: 'Choker' },
        16: { cm: 40.6, type: 'Choker' },
        18: { cm: 45.7, type: 'Princess' },
        20: { cm: 50.8, type: 'Matinee' },
        22: { cm: 55.9, type: 'Matinee' },
        24: { cm: 61.0, type: 'Matinee' },
        30: { cm: 76.2, type: 'Opera' },
        36: { cm: 91.4, type: 'Rope' },
      },
    },
  };
}
