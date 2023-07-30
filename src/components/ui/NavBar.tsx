import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export const NavBar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth0();

  let userElement: JSX.Element | null = null;
  if (isAuthenticated && user) {
    const firstInitial = user.given_name?.charAt(0) ?? "";
    const lastInitial = user.family_name?.charAt(0) ?? "";
    const initials = firstInitial + lastInitial;
    userElement = (
      <div className="flex-none gap-2">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="avatar placeholder">
              <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                <span className="text-xs">{initials}</span>
              </div>
            </div>
          </label>
          <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52">
            <li>
              <a onClick={() => logout()}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  return (
    <div className="navbar max-w-4xl self-center bg-base-100 shadow-xl rounded-box pl-4 pr-4">
      <div className="flex-1">
        <span className="text-xl">Fireblocks Cosigner Example</span>
      </div>
      {userElement}
    </div>
  );
};
