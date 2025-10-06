const Department = require("../models/Department");
const User = require("../models/User");

/** ===== Helper: build preview list (max 5, manager first, KHÔNG mượn người khác) ===== */
async function buildPreview(depDoc) {
  // Lấy đúng member thuộc phòng ban này
  const members = await User.find(
    { "department.department_id": depDoc._id },
    "full_name role avatar jobTitle"
  ).lean();

  const preview = [];
  const seen = new Set();

  // Ưu tiên manager nếu có
  if (depDoc.managerId) {
    preview.push({
      _id: String(depDoc.managerId._id),
      full_name: depDoc.managerId.full_name,
      role: depDoc.managerId.role,
      avatar: depDoc.managerId.avatar,
      jobTitle: depDoc.managerId.jobTitle || "Manager",
      isManager: true,
    });
    seen.add(String(depDoc.managerId._id));
  }

  // Bổ sung các member còn lại (đúng dept), tối đa 5
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
    if (preview.length >= 5) break;
  }

  return { membersCount: members.length, membersPreview: preview };
}

/** 1) Tạo phòng ban (ràng buộc: 1 người không được làm manager > 1 phòng ban) */
exports.createDepartment = async (req, res) => {
  try {
    const { department_name, description, managerId } = req.body;

    let manager = null;
    if (managerId) {
      manager = await User.findById(managerId);
      if (!manager) {
        return res
          .status(400)
          .json({ success: false, message: "Manager không tồn tại" });
      }
      const existed = await Department.findOne({ managerId });
      if (existed) {
        return res.status(400).json({
          success: false,
          message: "Người này đã là Manager của một phòng ban khác.",
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
    res.status(400).json({ success: false, message: error.message });
  }
};

/** 2) Danh sách phòng ban (search q + phân trang + sort + preview đúng dept) */
exports.getDepartments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 6,
      q = "",
      sortBy = "created_at",
      sortOrder = "asc",
    } = req.query;

    const filter = q
      ? { department_name: { $regex: q.trim(), $options: "i" } }
      : {};

    const sort = {};
    sort[sortBy] = String(sortOrder).toLowerCase() === "desc" ? -1 : 1;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, parseInt(limit, 10) || 6);

    const [items, total] = await Promise.all([
      Department.find(filter)
        .sort(sort)
        .skip((p - 1) * lim)
        .limit(lim)
        .populate("managerId", "full_name email role avatar jobTitle")
        .lean(),
      Department.countDocuments(filter),
    ]);

    const data = [];
    for (const dep of items) {
      const { membersCount, membersPreview } = await buildPreview(dep);
      data.push({ ...dep, membersCount, membersPreview });
    }

    res.status(200).json({
      success: true,
      data,
      total,
      page: p,
      pages: Math.ceil(total / lim),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** 3) Chi tiết phòng ban (nếu cần full members dùng API #4 dành cho ViewAll) */
// 3) Chi tiết phòng ban (sửa phần members để include department)
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id)
      .populate("managerId", "full_name email role avatar jobTitle")
      .lean();

    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng ban" });
    }

    // THAY DÒNG NÀY: thêm employeeId và department vào projection
    const members = await User.find(
  { "department.department_id": id },
  "employeeId full_name avatar jobTitle status role"   // <— thêm role
).lean();


    res.status(200).json({
      success: true,
      data: { ...department, members },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** 4) View All: Lấy full members của 1 phòng ban (phân trang + search + sort) */
exports.getDepartmentMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      q,
      sortBy = "full_name",
      sortOrder = "asc",
    } = req.query;

    const dep = await Department.findById(id).lean();
    if (!dep)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng ban" });

    const query = { "department.department_id": id };
    if (q && q.trim()) {
      query.$or = [
        { full_name: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } },
        { employeeId: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (p - 1) * lim;

    const [members, total] = await Promise.all([
      User.find(query)
        .select("employeeId full_name avatar jobTitle status role")
        .sort(sort)
        .skip(skip)
        .limit(lim)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        department: { _id: dep._id, department_name: dep.department_name },
        members,
        total,
        page: p,
        pages: Math.max(1, Math.ceil(total / lim)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** 5) Thêm nhân viên vào phòng ban
 *  - Không cho 1 phòng ban có 2 Manager
 *  - Không cho add user đã thuộc phòng ban khác
 */
exports.addEmployeeToDepartment = async (req, res) => {
  try {
    const { departmentId, employeeId } = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng ban" });
    }

    const user = await User.findById(employeeId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhân viên" });
    }

    if (user.department && user.department.department_id) {
      return res.status(400).json({
        success: false,
        message: `Nhân viên này đã thuộc phòng ban: ${user.department.department_name}`,
      });
    }

    // ràng buộc manager
    if (user.role === "Manager") {
      if (
        department.managerId &&
        String(department.managerId) !== String(user._id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Phòng ban này đã có Manager, không thể thêm Manager khác.",
        });
      }
      if (!department.managerId) {
        // user không được là manager ở dept khác
        const existed = await Department.findOne({ managerId: user._id });
        if (existed) {
          return res.status(400).json({
            success: false,
            message: "Người này đã là Manager của một phòng ban khác.",
          });
        }
        department.managerId = user._id;
        await department.save();
      }
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
    res.status(400).json({ success: false, message: error.message });
  }
};

/** 6) Xoá nhân viên khỏi phòng ban (nếu là Manager thì bỏ managerId của phòng ban) */
exports.removeEmployeeFromDepartment = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const user = await User.findById(employeeId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhân viên" });
    }
    if (!user.department || !user.department.department_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nhân viên này chưa thuộc phòng ban nào",
        });
    }

    const oldDepartmentId = user.department.department_id;
    const oldDepartmentName = user.department.department_name;

    const dep = await Department.findById(oldDepartmentId);
    if (dep && dep.managerId && String(dep.managerId) === String(user._id)) {
      dep.managerId = null;
      await dep.save();
    }

    user.department = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Đã xóa nhân viên khỏi phòng ban: ${oldDepartmentName}`,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** 7) Lấy options id + tên phòng ban */
exports.getDepartmentOptions = async (req, res) => {
  try {
    const departments = await Department.find({}, "_id department_name").lean();
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkDepartmentManager = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng ban" });
    }
    if (department.managerId) {
      return res
        .status(200)
        .json({
          success: true,
          hasManager: true,
          message: "Phòng ban đã có quản lý",
        });
    }
    res
      .status(200)
      .json({
        success: true,
        hasManager: false,
        message: "Phòng ban chưa có quản lý",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Kiểm tra department đã có manager chưa
exports.checkDepartmentManager = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng ban" });
    }
    if (department.managerId) {
      return res
        .status(200)
        .json({
          success: true,
          hasManager: true,
          message: "Phòng ban đã có quản lý",
        });
    }
    res
      .status(200)
      .json({
        success: true,
        hasManager: false,
        message: "Phòng ban chưa có quản lý",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
