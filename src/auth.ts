import firebase, { User } from 'firebase/app';

export const watchUser = (o: { authenticated: (user: User) => void, unauthenticated: () => void }) => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      o.authenticated(user);
    } else {
      o.unauthenticated();
    }
  });
};

export async function logout() {
  await firebase.auth().signOut();
}

export async function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  await firebase.auth().signInWithRedirect(provider);

  // This gives you a Google Access Token. You can use it to access the Google API.
  // The token acutally does exist. It's just
  // const token = (result.credential as any).accessToken as string;
  // The signed-in user info.
  // const user = result.user;
  // ...
}


export default {
  watchUser,
  logout,
  signIn,
};
