/**
 * ============================================
 * PRODUCT SPECIFICATIONS FIELDS COMPONENT
 * ============================================
 *
 * Dynamic product-specific fields that render based on product type.
 * Implements dropdown + custom input pattern for maximum flexibility.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductType, ClaspType } from '../../../types/order.types';
import type { GoldDetailsFormData } from '../../../types/order.types';

interface ProductSpecificationsFieldsProps {
  form: UseFormReturn<GoldDetailsFormData>;
}

/**
 * ProductSpecificationsFields Component
 * Dynamically renders product-specific fields based on selected product type
 */
export const ProductSpecificationsFields: React.FC<ProductSpecificationsFieldsProps> = ({
  form,
}) => {
  const { register, watch } = form;

  const productType = watch('productType');

  // Don't render anything if no product type selected
  if (!productType) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Product Specifications</h3>
        <p className="text-sm text-gray-500 mt-1">
          Add specific details for this {productType.toLowerCase().replace('_', ' ')}
        </p>
      </div>

      {/* RING SPECIFICATIONS */}
      {productType === ProductType.RING && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ring Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ring Size</label>
            <select
              {...register('productSpecifications.size' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select size</option>
              <option value="4">4</option>
              <option value="4.5">4.5</option>
              <option value="5">5</option>
              <option value="5.5">5.5</option>
              <option value="6">6</option>
              <option value="6.5">6.5</option>
              <option value="7">7</option>
              <option value="7.5">7.5</option>
              <option value="8">8</option>
              <option value="8.5">8.5</option>
              <option value="9">9</option>
              <option value="9.5">9.5</option>
              <option value="10">10</option>
              <option value="10.5">10.5</option>
              <option value="11">11</option>
              <option value="11.5">11.5</option>
              <option value="12">12</option>
              <option value="FREE_SIZE">Free Size</option>
              <option value="ADJUSTABLE">Adjustable</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Custom Size (if CUSTOM selected) */}
          {watch('productSpecifications.size' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Size</label>
              <input
                type="text"
                {...register('productSpecifications.customSize' as const)}
                placeholder="e.g., 7.25"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Ring Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ring Style</label>
            <select
              {...register('productSpecifications.ringStyle' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select style</option>
              <option value="SOLITAIRE">Solitaire</option>
              <option value="HALO">Halo</option>
              <option value="THREE_STONE">Three Stone</option>
              <option value="ETERNITY_BAND">Eternity Band</option>
              <option value="COCKTAIL">Cocktail</option>
              <option value="SIGNET">Signet</option>
              <option value="STACKABLE">Stackable</option>
              <option value="STATEMENT">Statement</option>
              <option value="TRADITIONAL">Traditional</option>
              <option value="CONTEMPORARY">Contemporary</option>
              <option value="VINTAGE">Vintage</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Custom Ring Style */}
          {watch('productSpecifications.ringStyle' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Ring Style
              </label>
              <input
                type="text"
                {...register('productSpecifications.customRingStyle' as const)}
                placeholder="Describe the ring style"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Band Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Band Width (mm)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.bandWidth' as const, { valueAsNumber: true })}
              placeholder="e.g., 2.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Typical range: 1.5-10mm</p>
          </div>

          {/* Band Thickness */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Band Thickness (mm)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.bandThickness' as const, { valueAsNumber: true })}
              placeholder="e.g., 1.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Typical range: 1-3mm</p>
          </div>

          {/* Is Resizable */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.isResizable' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">Resizable</label>
              <p className="text-xs text-gray-500">Can the ring size be adjusted later?</p>
            </div>
          </div>

          {/* Engraving */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Engraving Text (Optional)
            </label>
            <input
              type="text"
              {...register('productSpecifications.engraving' as const)}
              placeholder="e.g., initials or special message"
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max 200 characters</p>
          </div>
        </div>
      )}

      {/* NECKLACE SPECIFICATIONS */}
      {productType === ProductType.NECKLACE && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Necklace Length
            </label>
            <select
              {...register('productSpecifications.length' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select length</option>
              <option value="14-16 inches (Choker)">14-16 inches (Choker)</option>
              <option value="17-19 inches (Princess)">17-19 inches (Princess)</option>
              <option value="20-24 inches (Matinee)">20-24 inches (Matinee)</option>
              <option value="28-34 inches (Opera)">28-34 inches (Opera)</option>
              <option value="35+ inches (Rope)">35+ inches (Rope)</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Custom Length */}
          {watch('productSpecifications.length' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Length
              </label>
              <input
                type="text"
                {...register('productSpecifications.customLength' as const)}
                placeholder="e.g., 22 inches"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Clasp Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Clasp Type</label>
            <select
              {...register('productSpecifications.claspType' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select clasp</option>
              <option value={ClaspType.SPRING_RING}>Spring Ring</option>
              <option value={ClaspType.LOBSTER}>Lobster</option>
              <option value={ClaspType.TOGGLE}>Toggle</option>
              <option value={ClaspType.BARREL}>Barrel</option>
              <option value={ClaspType.MAGNETIC}>Magnetic</option>
              <option value={ClaspType.HOOK}>Hook</option>
              <option value={ClaspType.BOX}>Box</option>
              <option value={ClaspType.SLIDE}>Slide</option>
              <option value={ClaspType.NONE}>None</option>
              <option value={ClaspType.OTHER}>Other</option>
            </select>
          </div>

          {/* Custom Clasp Type */}
          {watch('productSpecifications.claspType' as any) === ClaspType.OTHER && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Clasp Type
              </label>
              <input
                type="text"
                {...register('productSpecifications.customClaspType' as const)}
                placeholder="Describe the clasp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Chain Thickness */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Chain Thickness (mm)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.chainThickness' as const, {
                valueAsNumber: true,
              })}
              placeholder="e.g., 2.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Typical range: 0.5-5mm</p>
          </div>

          {/* Layered */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.layered' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">Layered Design</label>
              <p className="text-xs text-gray-500">Multiple layers/strands</p>
            </div>
          </div>

          {/* Number of Layers (if layered) */}
          {watch('productSpecifications.layered' as any) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Layers
              </label>
              <input
                type="number"
                min="2"
                max="10"
                {...register('productSpecifications.numberOfLayers' as const, {
                  valueAsNumber: true,
                })}
                placeholder="e.g., 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Adjustable Length */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.adjustableLength' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">Adjustable Length</label>
              <p className="text-xs text-gray-500">Has extender chain</p>
            </div>
          </div>
        </div>
      )}

      {/* EARRINGS SPECIFICATIONS */}
      {productType === ProductType.EARRINGS && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Back Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Earring Back Type
            </label>
            <select
              {...register('productSpecifications.backType' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select back type</option>
              <option value="PUSH_BACK">Push Back</option>
              <option value="SCREW_BACK">Screw Back</option>
              <option value="LEVER_BACK">Lever Back</option>
              <option value="HOOK">Hook</option>
              <option value="HOOP">Hoop</option>
              <option value="CLIP_ON">Clip-On</option>
              <option value="MAGNETIC">Magnetic</option>
              <option value="HUGGIE">Huggie</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Custom Back Type */}
          {watch('productSpecifications.backType' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Back Type
              </label>
              <input
                type="text"
                {...register('productSpecifications.customBackType' as const)}
                placeholder="Describe the back type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Earring Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Earring Style</label>
            <select
              {...register('productSpecifications.earringsStyle' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select style</option>
              <option value="STUD">Stud</option>
              <option value="DROP">Drop</option>
              <option value="DANGLE">Dangle</option>
              <option value="HOOP">Hoop</option>
              <option value="HUGGIE">Huggie</option>
              <option value="CHANDELIER">Chandelier</option>
              <option value="JHUMKA">Jhumka</option>
              <option value="CLUSTER">Cluster</option>
              <option value="CONTEMPORARY">Contemporary</option>
              <option value="TRADITIONAL">Traditional</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Custom Earring Style */}
          {watch('productSpecifications.earringsStyle' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Earring Style
              </label>
              <input
                type="text"
                {...register('productSpecifications.customEarringsStyle' as const)}
                placeholder="Describe the style"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Drop Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Drop Length (mm)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.dropLength' as const, { valueAsNumber: true })}
              placeholder="e.g., 25"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">For drop/dangle earrings</p>
          </div>

          {/* Is Pair */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.isPair' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">Pair of Earrings</label>
              <p className="text-xs text-gray-500">Two matching earrings</p>
            </div>
          </div>
        </div>
      )}

      {/* BANGLES SPECIFICATIONS */}
      {productType === ProductType.BANGLES && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bangle Size</label>
            <select
              {...register('productSpecifications.size' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select size</option>
              <option value="2.2">2.2</option>
              <option value="2.4">2.4</option>
              <option value="2.6">2.6</option>
              <option value="2.8">2.8</option>
              <option value="2.10">2.10</option>
              <option value="2.12">2.12</option>
              <option value="FREE_SIZE">Free Size</option>
              <option value="ADJUSTABLE">Adjustable</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.size' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Size</label>
              <input
                type="text"
                {...register('productSpecifications.customSize' as const)}
                placeholder="e.g., 2.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Type</label>
            <select
              {...register('productSpecifications.openingType' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              <option value="SCREW">Screw</option>
              <option value="HINGE">Hinge</option>
              <option value="HOOK">Hook</option>
              <option value="CLOSED">Closed</option>
              <option value="FLEXIBLE">Flexible</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.openingType' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Opening Type
              </label>
              <input
                type="text"
                {...register('productSpecifications.customOpeningType' as const)}
                placeholder="e.g., Magnetic Clasp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Width (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.width' as const, { valueAsNumber: true })}
              placeholder="e.g., 8"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thickness (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.thickness' as const, { valueAsNumber: true })}
              placeholder="e.g., 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
            <input
              type="number"
              min="1"
              {...register('productSpecifications.quantity' as const, { valueAsNumber: true })}
              placeholder="e.g., 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.isSet' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Set of Bangles</label>
          </div>
        </div>
      )}

      {/* BRACELET SPECIFICATIONS */}
      {productType === ProductType.BRACELET && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bracelet Size</label>
            <select
              {...register('productSpecifications.length' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select size</option>
              <option value="6.5">6.5 inches</option>
              <option value="7">7 inches</option>
              <option value="7.5">7.5 inches</option>
              <option value="8">8 inches</option>
              <option value="8.5">8.5 inches</option>
              <option value="9">9 inches</option>
              <option value="ADJUSTABLE">Adjustable</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.length' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Length
              </label>
              <input
                type="text"
                {...register('productSpecifications.customLength' as const)}
                placeholder="e.g., 7.5 inches"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Clasp Type</label>
            <select
              {...register('productSpecifications.claspType' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select clasp</option>
              <option value="SPRING_RING">Spring Ring</option>
              <option value="LOBSTER">Lobster</option>
              <option value="TOGGLE">Toggle</option>
              <option value="BOX">Box</option>
              <option value="MAGNETIC">Magnetic</option>
              <option value="HOOK">Hook</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Width (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.width' as const, { valueAsNumber: true })}
              placeholder="e.g., 5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thickness (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.thickness' as const, { valueAsNumber: true })}
              placeholder="e.g., 2.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.isAdjustable' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Adjustable Length</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.charmAttachments' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Charm Attachments</label>
          </div>
        </div>
      )}

      {/* PENDANT SPECIFICATIONS */}
      {productType === ProductType.PENDANT && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Length (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.length' as const, { valueAsNumber: true })}
              placeholder="e.g., 30"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Width (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.width' as const, { valueAsNumber: true })}
              placeholder="e.g., 20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thickness (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.thickness' as const, { valueAsNumber: true })}
              placeholder="e.g., 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bail Type</label>
            <select
              {...register('productSpecifications.bailType' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              <option value="FIXED">Fixed</option>
              <option value="SLIDING">Sliding</option>
              <option value="HINGED">Hinged</option>
              <option value="SCREW_TOP">Screw Top</option>
              <option value="HIDDEN">Hidden</option>
              <option value="JUMP_RING">Jump Ring</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.bailType' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Bail Type
              </label>
              <input
                type="text"
                {...register('productSpecifications.customBailType' as const)}
                placeholder="e.g., Decorative Loop"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.includesChain' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Includes Chain</label>
          </div>
          {watch('productSpecifications.includesChain' as any) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chain Length</label>
              <input
                type="text"
                {...register('productSpecifications.chainLength' as const)}
                placeholder="e.g., 18 inches"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* CHAIN SPECIFICATIONS */}
      {productType === ProductType.CHAIN && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chain Length</label>
            <select
              {...register('productSpecifications.length' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select length</option>
              <option value="16">16 inches</option>
              <option value="18">18 inches</option>
              <option value="20">20 inches</option>
              <option value="22">22 inches</option>
              <option value="24">24 inches</option>
              <option value="26">26 inches</option>
              <option value="28">28 inches</option>
              <option value="30">30 inches</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.length' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Length
              </label>
              <input
                type="text"
                {...register('productSpecifications.customLength' as const)}
                placeholder="e.g., 25 inches"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Link Style</label>
            <select
              {...register('productSpecifications.linkStyle' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select style</option>
              <option value="CABLE">Cable</option>
              <option value="ROPE">Rope</option>
              <option value="BOX">Box</option>
              <option value="FIGARO">Figaro</option>
              <option value="CURB">Curb</option>
              <option value="SINGAPORE">Singapore</option>
              <option value="WHEAT">Wheat</option>
              <option value="SNAKE">Snake</option>
              <option value="BALL">Ball</option>
              <option value="PAPERCLIP">Paperclip</option>
              <option value="HERRINGBONE">Herringbone</option>
              <option value="BYZANTINE">Byzantine</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.linkStyle' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Link Style
              </label>
              <input
                type="text"
                {...register('productSpecifications.customLinkStyle' as const)}
                placeholder="e.g., Twisted Link"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thickness (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.thickness' as const, { valueAsNumber: true })}
              placeholder="e.g., 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Clasp Type</label>
            <select
              {...register('productSpecifications.claspType' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select clasp</option>
              <option value="LOBSTER">Lobster</option>
              <option value="SPRING_RING">Spring Ring</option>
              <option value="BOX">Box</option>
              <option value="TOGGLE">Toggle</option>
              <option value="NONE">None</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.isAdjustable' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Adjustable Chain</label>
          </div>
        </div>
      )}

      {/* ANKLET SPECIFICATIONS */}
      {productType === ProductType.ANKLET && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Anklet Length</label>
            <select
              {...register('productSpecifications.length' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select length</option>
              <option value="9">9 inches</option>
              <option value="9.5">9.5 inches</option>
              <option value="10">10 inches</option>
              <option value="10.5">10.5 inches</option>
              <option value="11">11 inches</option>
              <option value="ADJUSTABLE">Adjustable</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.length' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Length
              </label>
              <input
                type="text"
                {...register('productSpecifications.customLength' as const)}
                placeholder="e.g., 9.5 inches"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Clasp Type</label>
            <select
              {...register('productSpecifications.claspType' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select clasp</option>
              <option value="LOBSTER">Lobster</option>
              <option value="SPRING_RING">Spring Ring</option>
              <option value="BOX">Box</option>
              <option value="TOGGLE">Toggle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thickness (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.thickness' as const, { valueAsNumber: true })}
              placeholder="e.g., 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.charmAttachments' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Charm Attachments</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.isAdjustable' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Adjustable Length</label>
          </div>
        </div>
      )}

      {/* MANGALSUTRA SPECIFICATIONS */}
      {productType === ProductType.MANGALSUTRA && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mangalsutra Length
            </label>
            <select
              {...register('productSpecifications.length' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select length</option>
              <option value="18-20">18-20 inches (Short)</option>
              <option value="22-24">22-24 inches (Medium)</option>
              <option value="26-30">26-30 inches (Long)</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.length' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Length
              </label>
              <input
                type="text"
                {...register('productSpecifications.customLength' as const)}
                placeholder="e.g., 24 inches"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Style</label>
            <select
              {...register('productSpecifications.style' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select style</option>
              <option value="SINGLE_LINE">Single Line</option>
              <option value="DOUBLE_LINE">Double Line</option>
              <option value="TRIPLE_LINE">Triple Line</option>
              <option value="VATI_STYLE">Vati Style</option>
              <option value="MODERN">Modern</option>
              <option value="TRADITIONAL">Traditional</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.style' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Style</label>
              <input
                type="text"
                {...register('productSpecifications.customStyle' as const)}
                placeholder="e.g., Hybrid Design"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* NOSE PIN SPECIFICATIONS */}
      {productType === ProductType.NOSE_PIN && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nose Pin Type</label>
            <select
              {...register('productSpecifications.type' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              <option value="STUD">Stud</option>
              <option value="L_SHAPE">L-Shape</option>
              <option value="SCREW">Screw</option>
              <option value="HOOP">Hoop</option>
              <option value="BONE">Bone</option>
              <option value="FISHTAIL">Fishtail</option>
              <option value="NOSE_RING">Nose Ring</option>
              <option value="NATH">Nath</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.type' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Type</label>
              <input
                type="text"
                {...register('productSpecifications.customType' as const)}
                placeholder="e.g., Clip-On Nose Pin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gauge Size</label>
            <select
              {...register('productSpecifications.gaugeSize' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gauge</option>
              <option value="20G">20G (0.8mm)</option>
              <option value="18G">18G (1.0mm)</option>
              <option value="16G">16G (1.2mm)</option>
              <option value="14G">14G (1.6mm)</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.gaugeSize' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Gauge Size
              </label>
              <input
                type="text"
                {...register('productSpecifications.customGaugeSize' as const)}
                placeholder="e.g., 22G (0.6mm)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* MAANG TIKKA SPECIFICATIONS */}
      {productType === ProductType.MAANG_TIKKA && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Maang Tikka Style
            </label>
            <select
              {...register('productSpecifications.style' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select style</option>
              <option value="TRADITIONAL">Traditional</option>
              <option value="CONTEMPORARY">Contemporary</option>
              <option value="CHAND_BALI">Chand Bali</option>
              <option value="PASSA_STYLE">Passa Style</option>
              <option value="MATHA_PATTI">Matha Patti</option>
              <option value="MINIMAL">Minimal</option>
              <option value="STATEMENT">Statement</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.style' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Style</label>
              <input
                type="text"
                {...register('productSpecifications.customStyle' as const)}
                placeholder="e.g., Fusion Style"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Length (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.length' as const, { valueAsNumber: true })}
              placeholder="e.g., 150"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* WAIST CHAIN SPECIFICATIONS */}
      {productType === ProductType.WAIST_CHAIN && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Waist Chain Length
            </label>
            <select
              {...register('productSpecifications.length' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select length</option>
              <option value="SMALL">28-32 inches (Small)</option>
              <option value="MEDIUM">34-38 inches (Medium)</option>
              <option value="LARGE">40-44 inches (Large)</option>
              <option value="ADJUSTABLE">Adjustable</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.length' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Length
              </label>
              <input
                type="text"
                {...register('productSpecifications.customLength' as const)}
                placeholder="e.g., 36 inches"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* TOE RING SPECIFICATIONS */}
      {productType === ProductType.TOE_RING && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Toe Ring Size</label>
            <select
              {...register('productSpecifications.size' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select size</option>
              <option value="1">Size 1</option>
              <option value="2">Size 2</option>
              <option value="3">Size 3</option>
              <option value="4">Size 4</option>
              <option value="5">Size 5</option>
              <option value="ADJUSTABLE">Adjustable</option>
              <option value="FREE_SIZE">Free Size</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('productSpecifications.isPair' as const)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Pair of Toe Rings</label>
          </div>
        </div>
      )}

      {/* BROOCH SPECIFICATIONS */}
      {productType === ProductType.BROOCH && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Brooch Style</label>
            <select
              {...register('productSpecifications.style' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select style</option>
              <option value="PIN_BACK">Pin Back</option>
              <option value="SAFETY_CATCH">Safety Catch</option>
              <option value="MAGNETIC">Magnetic</option>
              <option value="TRADITIONAL">Traditional</option>
              <option value="CONTEMPORARY">Contemporary</option>
              <option value="STATEMENT">Statement</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.style' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Style</label>
              <input
                type="text"
                {...register('productSpecifications.customStyle' as const)}
                placeholder="e.g., Scarf Pin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Size (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.size' as const, { valueAsNumber: true })}
              placeholder="e.g., 40"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* CUFFLINKS SPECIFICATIONS */}
      {productType === ProductType.CUFFLINKS && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cufflinks Style
            </label>
            <select
              {...register('productSpecifications.style' as const)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select style</option>
              <option value="CLASSIC_TOGGLE">Classic Toggle</option>
              <option value="BULLET_BACK">Bullet Back</option>
              <option value="WHALE_BACK">Whale Back</option>
              <option value="CHAIN_LINK">Chain Link</option>
              <option value="STUD">Stud</option>
              <option value="MODERN">Modern</option>
              <option value="TRADITIONAL">Traditional</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {watch('productSpecifications.style' as any) === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Style</label>
              <input
                type="text"
                {...register('productSpecifications.customStyle' as const)}
                placeholder="e.g., Custom Design"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Size (mm)</label>
            <input
              type="number"
              step="0.1"
              {...register('productSpecifications.size' as const, { valueAsNumber: true })}
              placeholder="e.g., 15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* OTHER / CUSTOM SPECIFICATIONS */}
      {productType === ProductType.OTHER && (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Description
            </label>
            <textarea
              {...register('productSpecifications.description' as const)}
              placeholder="Describe the product specifications..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
