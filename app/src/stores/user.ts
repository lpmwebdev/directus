import api, { RequestConfig } from '@/api';
import { userName } from '@/utils/user-name';
import { Role, User } from '@directus/types';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import type { RouteLocationNormalized } from 'vue-router';

type ShareUser = {
	share: string;
	admin_access: boolean;
	app_access: boolean;
};

type AppUser = User & {
	admin_access: boolean;
	app_access: boolean;
	enforce_tfa: boolean;
	roles: Role[];
};

export const useUserStore = defineStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as AppUser | ShareUser | null,
		loading: false,
		error: null,
	}),
	getters: {
		fullName(): string | null {
			if (this.currentUser === null || 'share' in this.currentUser) return null;
			return userName(this.currentUser);
		},
		isAdmin(): boolean {
			return this.currentUser?.admin_access === true || false;
		},
	},
	actions: {
		async hydrate() {
			this.loading = true;

			try {
				const fields = ['*', 'avatar.id', 'role.id'];

				const [{ data: user }, { data: flags }, { data: roles }] = await Promise.all([
					api.get(`/users/me`, { params: { fields } }),
					api.get('/policies/me/flags'),
					api.get('/roles/me', { params: { fields: ['id'] } }),
				]);

				this.currentUser = { ...user.data, ...flags.data, roles: roles.data };
			} catch (error: any) {
				this.error = error;
			} finally {
				this.loading = false;
			}
		},
		async dehydrate() {
			this.$reset();
		},
		async hydrateAdditionalFields(fields: string[]) {
			try {
				const { data } = await api.get(`/users/me`, { params: { fields } });

				this.currentUser = merge({}, this.currentUser, data.data);
			} catch (error: any) {
				// Do nothing
			}
		},
		async trackPage(to: RouteLocationNormalized) {
			/**
			 * We don't want to track the full screen preview from live previews as part of the user's
			 * last page, as that'll cause a fresh login to navigate to the full screen preview where
			 * you can't navigate away from #19160
			 */
			if (to.path.endsWith('/preview')) {
				return;
			}

			await api.patch(
				`/users/me/track/page`,
				{
					last_page: to.fullPath,
				},
				{ measureLatency: true } as RequestConfig,
			);

			if (this.currentUser && !('share' in this.currentUser)) {
				this.currentUser.last_page = to.fullPath;
			}
		},
	},
});
