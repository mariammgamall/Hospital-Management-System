const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates a new department
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return next(new AppError('Department name already exists.', 400));
    }

    const dept = await prisma.department.create({
      data: { name, description }
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department: dept
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all departments
 */
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { doctors: true, staff: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      departments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a department
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) return next(new AppError('Department not found.', 404));

    await prisma.department.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  deleteDepartment
};
