const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all pharmacy inventory items
 */
const getInventory = async (req, res, next) => {
  try {
    const items = await prisma.medicineInventory.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new item to pharmacy inventory
 */
const addInventoryItem = async (req, res, next) => {
  try {
    const { name, code, category, stockQuantity, unitPrice, minThreshold, supplier } = req.body;
    
    const existing = await prisma.medicineInventory.findFirst({
      where: { OR: [{ name }, { code }] }
    });

    if (existing) {
      return next(new AppError('A medicine with this name or code already exists in inventory.', 400));
    }

    const item = await prisma.medicineInventory.create({
      data: {
        name,
        code,
        category,
        stockQuantity: parseInt(stockQuantity) || 0,
        unitPrice: parseFloat(unitPrice) || 0.0,
        minThreshold: parseInt(minThreshold) || 10,
        supplier
      }
    });

    res.status(201).json({ status: 'success', data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * Update stock level or details of an inventory item
 */
const updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockQuantity, unitPrice, minThreshold, supplier } = req.body;

    const updated = await prisma.medicineInventory.update({
      where: { id },
      data: {
        ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(minThreshold !== undefined && { minThreshold: parseInt(minThreshold) }),
        ...(supplier && { supplier })
      }
    });

    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all prescriptions for dispensing (for Pharmacist)
 */
const getPharmacyPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        patient: true,
        doctor: { include: { user: true } },
        medicines: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: prescriptions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  getPharmacyPrescriptions
};
