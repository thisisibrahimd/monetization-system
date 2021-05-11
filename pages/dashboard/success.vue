<script>
export default {
	middleware({ query, $axios, redirect }) {
		const { token } = query
		if (token) {
			return $axios
				.$post(`/user/payment`, { token })
				.then(res => redirect("/dashboard"))
				.catch(err => redirect("/dashboard"))
		} else {
			redirect("/dashboard")
		}
	},
}
</script>
