const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates/Registers a new Staff profile (Nurse or Receptionist)
 */
const createStaff = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('A user with this email address already exists.', 400));
    }

    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        return next(new AppError('The specified department does not exist.', 404));
      }
    }

    // Hash the password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User & Staff in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role // NURSE or RECEPTIONIST
        }
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          departmentId: departmentId || null
        }
      });

      return { user, staff };
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0) + role.slice(1).toLowerCase()} user registered successfully.`,
      staff: result.staff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all staff with department filter and searches
 */
const getAllStaff = async (req, res, next) => {
  try {
    const { search, departmentId, role } = req.query;

    const whereClause = {};
    if (departmentId) whereClause.departmentId = departmentId;

    if (role) {
      whereClause.user = { role };
    } else {
      whereClause.user = { role: { in: ['NURSE', 'RECEPTIONIST'] } };
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const staffList = await prisma.staff.findMany({
      where: whereClause,
      include: {
        department: true,
        user: {
          select: { email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      staff: staffList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates staff information
 */
const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, departmentId } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    
    if (departmentId !== undefined) {
      if (departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) return next(new AppError('The specified department does not exist.', 404));
        updateData.departmentId = departmentId;
      } else {
        updateData.departmentId = null;
      }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        user: { select: { email: true, role: true } }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Staff profile updated successfully.',
      staff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a staff member
 */
const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return next(new AppError('Staff member not found.', 404));

    // Cascade deletes User record (which cascade-deletes the staff profile)
    await prisma.user.delete({ where: { id: staff.userId } });

    res.status(200).json({
      success: true,
      message: 'Staff account deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff
};
