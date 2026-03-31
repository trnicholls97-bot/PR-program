import Foundation
import Observation

// MARK: - FirebaseService (stub — add Firebase iOS SDK to enable)
//
// TO ENABLE CLOUD SYNC:
// 1. Add the Firebase iOS SDK via Swift Package Manager:
//    File -> Add Package Dependencies -> https://github.com/firebase/firebase-ios-sdk
//    Add: FirebaseAuth, FirebaseFirestore
// 2. Download GoogleService-Info.plist from Firebase Console and add to the IronLog target.
// 3. In IronLogApp.swift, uncomment: FirebaseApp.configure()
// 4. Implement signInWithGoogle(), syncToCloud(), fetchFromCloud() below.

@Observable
class FirebaseService {
    var isSignedIn: Bool = false
    var currentUser: UserInfo? = nil
    var onAuthChange: ((UserInfo?) -> Void)? = nil

    // MARK: - Auth
    func signInWithGoogle() async {
        // TODO: Implement with FirebaseAuth + Google Sign-In SDK
        // import FirebaseAuth
        // let provider = GoogleAuthProvider()
        // let result = try await Auth.auth().signIn(with: provider)
        // let user = result.user
        // let info = UserInfo(uid: user.uid, displayName: user.displayName, email: user.email)
        // await MainActor.run { self.currentUser = info; self.isSignedIn = true; self.onAuthChange?(info) }
    }

    func signOut() {
        // TODO: try? Auth.auth().signOut()
        currentUser = nil
        isSignedIn = false
        onAuthChange?(nil)
    }

    // MARK: - Sync
    func syncToCloud(_ data: Data) async throws {
        // TODO: Firestore upload
        // let db = Firestore.firestore()
        // guard let uid = currentUser?.uid else { return }
        // try await db.document("users/\(uid)/data/state").setData(["blob": data.base64EncodedString()])
    }

    func fetchFromCloud() async throws -> Data? {
        // TODO: Firestore download
        return nil
    }
}
