import AppPage from "@/components/app-page";
import GroupsTab from "@/components/permissions/groups-tab";
import UsersTab from "@/components/permissions/users-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

export default function Permissions() {
    const { t } = useTranslation();

    return (
        <AppPage>
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-2xl font-bold mb-1">{t("permissions.heading")}</h1>
                <p className="text-muted-foreground mb-6">{t("permissions.description")}</p>

                <Tabs defaultValue="groups" className="w-full">
                    <TabsList>
                        <TabsTrigger value="groups">{t("permissions.groupsTab")}</TabsTrigger>
                        <TabsTrigger value="users">{t("permissions.usersTab")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="groups" className="mt-4">
                        <GroupsTab />
                    </TabsContent>

                    <TabsContent value="users" className="mt-4">
                        <UsersTab />
                    </TabsContent>
                </Tabs>
            </div>
        </AppPage>
    );
}
