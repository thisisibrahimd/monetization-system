import { config } from '../config'

export default function({ $auth, redirect }) {
	const admins = config.admins
	if (!admins.includes($auth.user.id)) return redirect("/dashboard")
}
