import { useEffect, createContext, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
} from "firebase/auth";
import { auth } from "../config/firebase-config";
import { apiConfig } from "../config/api-config";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const idToken = await currentUser.getIdToken(true);
      try {
        const response = await apiConfig.post(
          "auth/login",
          {},
          {
            headers: {
              "Authorization": `Bearer ${idToken}`,
            },
          }
        );
        if (response.status === 200) {
          const user = response.data;
          setAuthenticatedUser(user);
        } else {
          console.error("Error verifying user:", response);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signup = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const data = JSON.stringify({
        uid: user.uid,
        email: user.email,
        username: username,
      });
      const response = await apiConfig.post("auth/signup", data);
      if (response.status === 200) {
        console.log("User data saved successfully");
        const userData = response.data;
        setAuthenticatedUser(userData);
      } else {
        console.error("Error saving user data");
        if (user) {
          await deleteUser(user);
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();
      try {
        const response = await apiConfig.post(
          "auth/login",
          {},
          {
            headers: {
              "Authorization": `Bearer ${idToken}`,
            },
          }
        );
        if (response.status === 200) {
          const user = response.data;
          setAuthenticatedUser(user);
        } else {
          console.error("Error logging in user:", response);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error logging in:", err);
    }
  };
  const logout = async () => {
    await signOut(auth);
    setAuthenticatedUser(null);
  };

  const contextValue = {
    authenticatedUser,
    isLoading,
    login,
    logout,
    signup,
  };
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
