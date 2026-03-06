#!/bin/bash

# 重置 admin 用户密码脚本
# 密码: 123456 的 bcrypt hash

echo "正在重置 admin 用户密码..."

docker exec mongodb mongosh blog --eval "
db.users.updateOne(
  { username: 'admin' },
  { 
    \\\$set: { 
      password: '\\\$2a\\\$10\\\$y8RfFOI1XL9/ikUv/3WT4.BBPqjdIb7CC/vTIpElHuZF.CFSaxFGa'
    }
  },
  { upsert: true }
);
print('密码已重置为: 123456');
"

echo ""
echo "✅ 完成！现在可以使用 admin / 123456 登录"
