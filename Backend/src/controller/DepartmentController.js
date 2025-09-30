const Department = require("../models/Department");
const User = require("../models/User");

// 1. Tạo phòng ban
exports.createDepartment = async (req, res) => {
  try {
    const { department_name, description, managerId } = req.body;

    let manager = null;

    if (managerId) {
      manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: "Manager không tồn tại",
        });
      }
    }

    const department = await Department.create({
      department_name,
      description,
      managerId: manager ? manager._id : null,
    });

    if (manager) {
      manager.role = "Manager";
      manager.department = {
        department_id: department._id,
        department_name: department.department_name,
      };
      await manager.save();
    }

    res.status(201).json({
      success: true,
      message: "Tạo phòng ban thành công",
      data: department,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Lấy tất cả phòng ban (có preview 5 người + đếm tổng)
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("managerId", "full_name email role avatar jobTitle")
      .lean();

    const result = await Promise.all(
      departments.map(async (dep) => {
        const members = await User.find(
          { "department.department_id": dep._id },
          "full_name email role avatar jobTitle"
        ).lean();
        const preview = [];
        const seen = new Set();

        if (dep.managerId) {
          preview.push({
            _id: String(dep.managerId._id),
            full_name: dep.managerId.full_name,
            role: dep.managerId.role,
            avatar: dep.managerId.avatar,
            jobTitle: dep.managerId.jobTitle || "Manager",
            isManager: true,
          });
          seen.add(String(dep.managerId._id));
        }

        for (const u of members) {
          const uid = String(u._id);
          if (seen.has(uid)) continue;
          preview.push({
            _id: uid,
            full_name: u.full_name,
            role: u.role,
            avatar: u.avatar,
            jobTitle: u.jobTitle,
            isManager: false,
          });
          seen.add(uid);
          if (preview.length >= 5) break;
        }

        return {
          ...dep,
          members,                    
          membersCount: members.length,
          membersPreview: preview,    
        };
      })
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// 3. Lấy chi tiết phòng ban 
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id)
      .populate("managerId", "full_name email role avatar")
      .lean();

    if (!department) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phòng ban" });
    }

    const members = await User.find(
      { "department.department_id": id },
      "full_name email role avatar jobTitle status"
    );

    res.status(200).json({
      success: true,
      data: { ...department, members },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Tìm kiếm theo tên phòng ban hoặc nhân viên
exports.searchDepartments = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const departments = await Department.find({
      department_name: { $regex: keyword, $options: "i" },
    }).populate("managerId", "full_name email avatar");

    const users = await User.find({
      full_name: { $regex: keyword, $options: "i" },
    }).populate("department.department_id", "department_name");

    res.status(200).json({
      success: true,
      data: { departments, users },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Thêm nhân viên có sẵn vào phòng ban
exports.addEmployeeToDepartment = async (req, res) => {
  try {
    const { departmentId, employeeId } = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phòng ban",
      });
    }

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    if (user.department && user.department.department_id) {
      return res.status(400).json({
        success: false,
        message: `Nhân viên này đã thuộc phòng ban: ${user.department.department_name}`,
      });
    }
    user.department = {
      department_id: department._id,
      department_name: department.department_name,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Thêm nhân viên vào phòng ban thành công",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Xóa nhân viên khỏi phòng ban
exports.removeEmployeeFromDepartment = async (req, res) => {
  try {
    const { employeeId } = req.body;


    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    if (!user.department || !user.department.department_id) {
      return res.status(400).json({
        success: false,
        message: "Nhân viên này chưa thuộc phòng ban nào",
      });
    }

    const oldDepartment = user.department.department_name;

    user.department = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Đã xóa nhân viên khỏi phòng ban: ${oldDepartment}`,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Lấy ra id và tên phòng ban
exports.getDepartmentOptions = async (req, res) => {
  try {
    const departments = await Department.find({}, "_id department_name");
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


