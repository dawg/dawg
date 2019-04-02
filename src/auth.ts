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
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  await firebase.auth().signInWithRedirect(provider);
}


export default {
  watchUser,
  logout,
  signIn,
};
