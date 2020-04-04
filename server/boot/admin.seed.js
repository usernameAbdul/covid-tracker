'use strict';

module.exports = function(app) {
    var User = app.models.Administrator;
    var Role = app.models.Role;
    var RoleMapping = app.models.RoleMapping;
    var ACL = app.models.ACL;
    User.findOrCreate({
            firstName: 'Administrator',
            lastName: '',
            email: 'admin@swyftlogistics.com',
            username: 'admin',
            password: '12345',
        },
        function(err, succ) {
            if (err) {} else {
                Role.create({
                        name: 'superUser',
                        type: 'admin',
                    },
                    function(createRoleError, createRole) {
                        createRole.principals.create({
                            principalType: RoleMapping.USER,
                            principalId: succ.id,
                        });
                    }
                );
            }
        }
    );
};