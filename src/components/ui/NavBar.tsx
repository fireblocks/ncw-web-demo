import React from "react";
import { useAppStore } from "../../AppStore";

export const NavBar: React.FC = () => {
  const { loggedUser, logout } = useAppStore();

  let userElement: JSX.Element | null = null;
  if (loggedUser) {
    const initials = loggedUser.displayName?.split(" ").map((n) => n[0]).join("") ?? "";
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
              <a onClick={logout}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  return (
    <div className="navbar max-w-4xl self-center bg-base-100 shadow-xl rounded-box pl-4 pr-4">
      <div className="flex-1">
        <span className="text-xl">Fireblocks NCW Example</span>
      </div>
      {userElement}
    </div>
  );
};
