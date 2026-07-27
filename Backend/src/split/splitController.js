import { supabase } from "../config/supabase.js";

const mapGroup = (g) => ({
  ...g,
  totalAmount: g.total_amount,
  createdAt: g.created_at,
  members: (g.split_members ?? []).map(m => ({
    ...m,
    createdAt: m.created_at,
  }))
})

export async function getGroups(req, res) {
  try {
    const { data: groups, error } = await supabase
      .from("split_groups")
      .select("*, split_members(*)")
      .eq("created_by", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ data: groups.map(mapGroup) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getGroup(req, res) {
  try {
    const { data: group, error } = await supabase
      .from("split_groups")
      .select("*, split_members(*)")
      .eq("id", req.params.id)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!group) return res.status(404).json({ error: "Group not found" });
    return res.status(200).json({ data: mapGroup(group) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function createGroup(req, res) {
  try {
    const { name, description, totalAmount, members } = req.body;
    if (!name || !totalAmount || !members?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: group, error: groupError } = await supabase
      .from("split_groups")
      .insert([{ name, description, total_amount: totalAmount, created_by: req.user.id, status: "pending" }])
      .select()
      .single();

    if (groupError) throw groupError;

    const memberRows = members.map(m => ({
      group_id: group.id,
      email: m.email,
      name: m.email.split("@")[0],
      share: m.share,
      paid: 0,
      owes: m.share,
      status: "pending"
    }));

    const { error: memberError } = await supabase
      .from("split_members")
      .insert(memberRows);

    if (memberError) throw memberError;

    const { data: full } = await supabase
      .from("split_groups")
      .select("*, split_members(*)")
      .eq("id", group.id)
      .single();

    return res.status(201).json({ data: mapGroup(full) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function settleShare(req, res) {
  try {
    const { groupId, memberId } = req.params;

    const { data: member, error: fetchError } = await supabase
      .from("split_members")
      .select("*")
      .eq("id", memberId)
      .eq("group_id", groupId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!member) return res.status(404).json({ error: "Member not found" });

    const { error: updateError } = await supabase
      .from("split_members")
      .update({ status: "settled", paid: member.share, owes: 0 })
      .eq("id", memberId);

    if (updateError) throw updateError;

    const { data: allMembers } = await supabase
      .from("split_members")
      .select("status")
      .eq("group_id", groupId);

    const allSettled = allMembers.every(m => m.status === "settled");

    if (allSettled) {
      await supabase
        .from("split_groups")
        .update({ status: "settled" })
        .eq("id", groupId);
    }

    return res.status(200).json({ message: "Settlement recorded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function deleteGroup(req, res) {
  try {
    const { error } = await supabase
      .from("split_groups")
      .delete()
      .eq("id", req.params.id)
      .eq("created_by", req.user.id);

    if (error) throw error;
    return res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}