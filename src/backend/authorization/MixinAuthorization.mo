import AccessControl "./access-control";
import Prim "mo:prim";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

mixin (accessControlState : AccessControl.AccessControlState) {
  let HARDCODED_ADMIN = Principal.fromText("lmmsf-dqn72-o5wi6-ab664-m7cwl-lejc3-nj6ys-ye6fs-jf3t4-prsqg-kae");

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func _initializeAccessControlWithSecret(userSecret : Text) : async () {
    switch (Prim.envVar<system>("CAFFEINE_ADMIN_TOKEN")) {
      case (null) {
        Runtime.trap("CAFFEINE_ADMIN_TOKEN environment variable is not set");
      };
      case (?adminToken) {
        AccessControl.initialize(accessControlState, caller, adminToken, userSecret);
      };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    // Hardcoded admin principal always returns true
    if (caller == HARDCODED_ADMIN) { return true };
    // For all others, check the role map without trapping
    switch (accessControlState.userRoles.get(caller)) {
      case (?role) { role == #admin };
      case (null) { false };
    };
  };
};
